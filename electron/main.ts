import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
import { fileURLToPath } from "node:url";
import path from "node:path";

import DownloadManager from "./DownloadManager";
import { getOrganizedPath, PathMetadata } from "./pathUtils";
import Store from "electron-store";
import { logInfo, logError } from "./logger";

// Initialize electron-store for persistings settings
const store = new Store();

// Default download path to user's downloads folder if not set
if (!store.get("downloadPath")) {
  store.set("downloadPath", app.getPath("downloads"));
}

// Setup Constants
// ----------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set application root directory
process.env.APP_ROOT = path.join(__dirname, "..");

// Define build paths
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

// Set static assets path
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// ----------------------
// Global Variables
// ----------------------

let win: BrowserWindow | null = null;

// Create DownloadManager instance
const downloadManager = new DownloadManager();

// ----------------------
// Database Initialization
// ----------------------

const dbPath = path.join(app.getPath("userData"), "downloads.db");
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS download_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    save_path TEXT,
    status TEXT,
    progress INTEGER,
    title TEXT,
    season INTEGER,
    episode INTEGER,
    thumbnail TEXT,
    description TEXT,
    rating TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ----------------------
// IPC Handlers
// ----------------------

function setupIPCHandlers() {
  // Handle file dialog requests
  ipcMain.handle("show-save-dialog", async (_event, options = {}) => {
    try {
      const result = await dialog.showSaveDialog(win!, {
        title: 'Save Downloaded File',
        defaultPath: options.defaultPath || 'downloaded_file',
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'] },
          { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a'] },
          { name: 'Archives', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] }
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      });

      return {
        canceled: result.canceled,
        filePath: result.filePath || null
      };
    } catch (error) {
      console.error("File dialog error:", error);
      return {
        canceled: true,
        filePath: null,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  // Handle start-download requests from renderer
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
        if (win && !win.isDestroyed()) {
          win.webContents.send("download-progress", {
            url: url,
            progress: progress,
            savePath: finalSavePath,
          });
        }
      });

      // Send completion message
      if (win && !win.isDestroyed()) {
        win.webContents.send("download-complete", {
          url: url,
          savePath: finalSavePath,
          success: true,
        });
      }

      // Save to database on success
      db.prepare(`
        INSERT OR REPLACE INTO download_history (id, url, save_path, status, progress, title, season, episode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `${url}-${Date.now()}`,
        url,
        finalSavePath,
        'completed',
        100,
        metadata?.seriesTitle || null,
        metadata?.season || null,
        metadata?.episode || null
      );

      console.log(`Download completed: ${finalSavePath}`);
      return { success: true, message: "Download completed successfully" };
    } catch (error) {
      console.error("Download error:", error);

      // Send error message
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

  // Settings & Configuration Handlers
  ipcMain.handle("get-settings", () => {
    return store.store;
  });

  ipcMain.handle("set-setting", (_event, { key, value }) => {
    store.set(key, value);
  });

  ipcMain.handle("select-directory", async () => {
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // Database IPC Handlers
  ipcMain.handle("get-download-history", () => {
    try {
      const stmt = db.prepare("SELECT * FROM download_history ORDER BY created_at DESC");
      return stmt.all();
    } catch (error) {
      console.error("Failed to get history:", error);
      return [];
    }
  });

  ipcMain.handle("save-download-record", (_event, record) => {
    try {
      const { url, save_path, status, progress, title, season, episode, thumbnail, description, rating } = record;
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO download_history (url, save_path, status, progress, title, season, episode, thumbnail, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run(url, save_path, status, progress, title, season, episode, thumbnail, description, rating);
      return { success: true };
    } catch (error) {
      logError("Failed to save download record", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}

// ----------------------
// Create Main Window
// ----------------------

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC!, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Send initial message to renderer process
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Load renderer
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools for debugging in development
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// ----------------------
// App Event Listeners
// ----------------------

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

// Re-create a window in the app when the dock icon is clicked (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create window and setup IPC when ready
app.whenReady().then(() => {
  setupIPCHandlers();
  createWindow();
  // Removed automatic testDownload() call - now controlled via UI
});