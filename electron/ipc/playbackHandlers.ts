import { ipcMain } from "electron";
import { logInfo, logError } from "../logger";
import { playerManager } from "../PlayerManager";
import type { IpcContext } from "./context";

export function registerPlaybackHandlers({ db }: IpcContext) {
  ipcMain.handle("play-file", async (_event, filePath: string) => {
    try {
      // 1. Get last position from DB
      const history = db.prepare("SELECT last_position FROM playback_history WHERE file_path = ?").get(filePath) as { last_position: number } | undefined;
      const startTime = history?.last_position || 0;

      // 2. Play file (Wait for player to close to save progress)
      logInfo(`Opening file: ${filePath} at ${startTime}s`);

      // We don't await here if we want the UI to be responsive,
      // but the requirement says "upon closing the player" update DB.
      // So we can do it in the background.
      playerManager.playFile(filePath, startTime).then(() => {
        logInfo(`Playback finished for ${filePath}`);
      });

      return { success: true };
    } catch (error) {
      logError("Failed to play file", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("get-playback-position", (_event, filePath: string) => {
    const row = db.prepare("SELECT last_position FROM playback_history WHERE file_path = ?").get(filePath) as { last_position: number } | undefined;
    return row?.last_position || 0;
  });

  ipcMain.handle("update-playback-position", (_event, { filePath, position, duration }: { filePath: string; position: number; duration: number }) => {
    db.prepare("INSERT OR REPLACE INTO playback_history (file_path, last_position, duration, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
      .run(filePath, position, duration);
    return { success: true };
  });
}
