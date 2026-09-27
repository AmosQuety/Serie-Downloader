import { ipcMain } from "electron";
import { getOrganizedPath, PathMetadata } from "../pathUtils";
import { logInfo, logError } from "../logger";
import type { IpcContext } from "./context";

export function registerDownloadHandlers({ getWindow, db, downloadManager }: IpcContext) {
  ipcMain.handle("start-download", async (_event, { url, savePath, metadata }: { url: string; savePath: string; metadata?: PathMetadata }) => {
    let finalSavePath = savePath;
    try {
      // Validate inputs
      if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided");
      }

      // If metadata is provided, generate an organized path
      if (metadata) {
        finalSavePath = getOrganizedPath(savePath, metadata);
      }

      logInfo(`Starting download: ${url} -> ${finalSavePath}`);

      // Start download with progress callback
      await downloadManager.downloadFile(url, finalSavePath, (progress) => {
        // Send progress update to the requesting window
        const win = getWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send("download-progress", {
            url: url,
            progress: progress,
            savePath: finalSavePath,
          });
        }
      });

      // Send completion message
      const win = getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send("download-complete", {
          url: url,
          savePath: finalSavePath,
          success: true,
          metadata,
        });
      }

      // Save to database on success
      db.prepare(`
        INSERT OR REPLACE INTO download_history (url, save_path, status, progress, title, season, episode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        url,
        finalSavePath,
        'completed',
        100,
        metadata?.seriesTitle || metadata?.title || null,
        metadata?.season || null,
        metadata?.episode || null
      );

      console.log(`Download completed: ${finalSavePath}`);
      return { success: true, message: "Download completed successfully" };
    } catch (error) {
      console.error("Download error:", error);

      // Send error message
      const win = getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send("download-error", {
          url: url || "unknown",
          savePath: finalSavePath || "unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("pause-download", async (_event, { url }: { url: string }) => {
    try {
      const stopped = await downloadManager.stopDownload(url);
      if (stopped) {
        db.prepare("UPDATE download_history SET status = 'paused' WHERE url = ?").run(url);
        return { success: true };
      }
      return { success: false, error: "Download not found or already stopped" };
    } catch (error) {
      logError("Pause download error", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("cancel-download", async (_event, { url }: { url: string }) => {
    try {
      await downloadManager.stopDownload(url);
      // Even if not active in manager, we remove from DB
      db.prepare("DELETE FROM download_history WHERE url = ?").run(url);
      db.prepare("DELETE FROM episodes WHERE download_url = ?").run(url);
      return { success: true };
    } catch (error) {
      logError("Cancel download error", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  // Throttling IPC
  ipcMain.handle("set-max-speed", (_event, speed: number) => {
    downloadManager.setMaxSpeed(speed);
  });
}
