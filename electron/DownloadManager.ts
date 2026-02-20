import fs from "fs";
import axios from "axios";
import https from "https";
import { Transform } from "stream";

type ProgressCallback = (progress: number) => void;

interface DownloadTask {
  url: string;
  savePath: string;
  onProgress?: ProgressCallback;
  resolve: () => void;
  reject: (err: any) => void;
  abortController: AbortController;
}

class DownloadManager {
  private MAX_RETRIES = 3;
  private INITIAL_RETRY_DELAY = 2000;
  private CONCURRENCY_LIMIT = 3;
  
  private queue: DownloadTask[] = [];
  private activeCount = 0;
  private activeTasks: Map<string, DownloadTask> = new Map();
  private maxSpeed: number = 0; // 0 = unlimited, in bytes per second

  constructor() {}

  /**
   * Set the maximum download speed in bytes per second
   */
  setMaxSpeed(speed: number) {
    this.maxSpeed = speed;
  }

  async downloadFile(
    url: string,
    savePath: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const abortController = new AbortController();
      const task = { url, savePath, onProgress, resolve, reject, abortController };
      this.queue.push(task);
      this.processQueue();
    });
  }

  /**
   * Pause/Cancel a download by URL
   */
  async stopDownload(url: string): Promise<boolean> {
    // Check active tasks
    const activeTask = this.activeTasks.get(url);
    if (activeTask) {
      activeTask.abortController.abort();
      this.activeTasks.delete(url);
      return true;
    }

    // Check queue
    const queueIndex = this.queue.findIndex(t => t.url === url);
    if (queueIndex !== -1) {
      const [task] = this.queue.splice(queueIndex, 1);
      task.reject(new Error("Download cancelled by user"));
      return true;
    }

    return false;
  }

  private async processQueue() {
    if (this.activeCount >= this.CONCURRENCY_LIMIT || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.activeCount++;
    this.activeTasks.set(task.url, task);

    try {
      await this.downloadWithRetry(task.url, task.savePath, task.abortController.signal, task.onProgress);
      task.resolve();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        task.reject(new Error("Paused"));
      } else {
        task.reject(error);
      }
    } finally {
      this.activeCount--;
      this.activeTasks.delete(task.url);
      this.processQueue();
    }
  }

  private async downloadWithRetry(
    url: string,
    savePath: string,
    signal: AbortSignal,
    onProgress?: ProgressCallback
  ): Promise<void> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      if (signal.aborted) throw new Error("AbortError");

      try {
        await this.executeDownload(url, savePath, signal, onProgress);
        return;
      } catch (error: any) {
        lastError = error;
        if (error.name === 'AbortError' || error.message === 'Paused') {
          throw error;
        }

        if (attempt < this.MAX_RETRIES) {
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  private async executeDownload(
    url: string,
    savePath: string,
    signal: AbortSignal,
    onProgress?: ProgressCallback
  ): Promise<void> {
    const writer = fs.createWriteStream(savePath);
    const httpsAgent = process.env.NODE_ENV === 'development' ? 
      new https.Agent({ rejectUnauthorized: false }) : undefined;

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      httpsAgent,
      timeout: 60000,
      signal, // Pass the abort signal to axios
    });

    const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
    let receivedBytes = 0;

    // Throttling Transform Stream
    const throttleTransform = new Transform({
      transform: (chunk, _encoding, callback) => {
        if (signal.aborted) {
          callback(new Error("AbortError"));
          return;
        }

        receivedBytes += chunk.length;
        
        if (onProgress && totalBytes > 0) {
          onProgress(Math.round((receivedBytes / totalBytes) * 100));
        }

        if (this.maxSpeed > 0) {
          // Rudimentary throttling: wait proportional to chunk size vs maxSpeed
          const waitTime = (chunk.length / this.maxSpeed) * 1000;
          setTimeout(() => callback(null, chunk), waitTime);
        } else {
          callback(null, chunk);
        }
      }
    });

    return new Promise((resolve, reject) => {
      const handleError = (err: any) => {
        writer.close();
        if (err.name === 'AbortError' || err.message === 'AbortError') {
          reject({ name: 'AbortError' });
        } else {
          fs.unlink(savePath, () => {});
          reject(err);
        }
      };

      response.data
        .pipe(throttleTransform)
        .pipe(writer);

      writer.on("finish", () => {
        writer.close();
        resolve();
      });

      writer.on("error", handleError);
      response.data.on("error", handleError);
      throttleTransform.on("error", handleError);

      signal.addEventListener('abort', () => {
        response.data.destroy();
        writer.destroy();
        handleError({ name: 'AbortError' });
      });
    });
  }
}

export default DownloadManager;
