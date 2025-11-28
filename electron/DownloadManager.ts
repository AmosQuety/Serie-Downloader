import fs from "fs";
import axios from "axios";
import https from "https";

type ProgressCallback = (progress: number) => void;

class DownloadManager {
  async downloadFile(
    url: string,
    savePath: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    try {
      const writer = fs.createWriteStream(savePath);

      // Create HTTPS agent for development that ignores certificate errors
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

      const totalBytes = parseInt(
        response.headers["content-length"] || "0",
        10
      );
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
        writer.on("finish", resolve);
        writer.on("error", reject);
        response.data.on("error", reject);
      });
    } catch (error: any) {
      console.error("Download failed:", error.message);
      throw new Error(`Download failed: ${error.message}`);
    }
  }
}

export default DownloadManager;