import type { BrowserWindow } from "electron";
import type BetterSqlite3 from "better-sqlite3";
import type Store from "electron-store";
import type DownloadManager from "../DownloadManager";

/**
 * Shared dependencies handed to every IPC handler module. `getWindow` is a
 * closure (not a snapshot) because `win` is reassigned as windows are
 * created/destroyed over the app's lifetime.
 */
export interface IpcContext {
  getWindow: () => BrowserWindow | null;
  db: BetterSqlite3.Database;
  store: Store;
  downloadManager: DownloadManager;
}
