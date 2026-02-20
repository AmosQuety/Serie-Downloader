import fs from "fs";
import axios from "axios";
import https from "https";

type ProgressCallback = (progress: number) => void;

class DownloadManager {
  private MAX_RETRIES = 3;
  private INITIAL_RETRY_DELAY = 2000; // 2 seconds

  async downloadFile(
    url: string,
    savePath: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.executeDownload(url, savePath, onProgress);
        return; // Success
      } catch (error: any) {
        lastError = error;
        console.warn(`Download attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Download failed after ${this.MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
  }

  private async executeDownload(
    url: string,
    savePath: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    const writer = fs.createWriteStream(savePath);

    const httpsAgent = process.env.NODE_ENV === 'development' ? 
      new https.Agent({ rejectUnauthorized: false }) : 
      undefined;

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      httpsAgent: httpsAgent,
      timeout: 30000, // 30 second timeout
      maxRedirects: 5, // Follow redirects
    });

    const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
    let receivedBytes = 0;

    response.data.pipe(writer);

    response.data.on("data", (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (onProgress && totalBytes > 0) {
        const progress = Math.round((receivedBytes / totalBytes) * 100);
        onProgress(progress);
      }
    });

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        writer.close();
        resolve();
      });
      writer.on("error", (err) => {
        writer.close();
        fs.unlink(savePath, () => {}); // Clean up partial file
        reject(err);
      });
      response.data.on("error", reject);
    });
  }
}

export default DownloadManager;