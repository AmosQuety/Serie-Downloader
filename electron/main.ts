import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

import DownloadManager from "./DownloadManager";

// ----------------------
// Setup Constants
// ----------------------

const require = createRequire(import.meta.url);
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
// IPC Handlers
// ----------------------

function setupIPCHandlers() {
  // Handle file dialog requests
  ipcMain.handle("show-save-dialog", async (event, options = {}) => {
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
  ipcMain.handle("start-download", async (event, { url, savePath }) => {
    try {
      // Validate inputs
      if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided");
      }
      if (!savePath || typeof savePath !== "string") {
        throw new Error("Invalid save path provided");
      }

      console.log(`Starting download: ${url} -> ${savePath}`);

      // Start download with progress callback
      await downloadManager.downloadFile(url, savePath, (progress) => {
        // Send progress update to the requesting window
        if (win && !win.isDestroyed()) {
          win.webContents.send("download-progress", {
            url: url,
            progress: progress,
            savePath: savePath,
          });
        }
      });

      // Send completion message
      if (win && !win.isDestroyed()) {
        win.webContents.send("download-complete", {
          url: url,
          savePath: savePath,
          success: true,
        });
      }

      console.log(`Download completed: ${savePath}`);
      return { success: true, message: "Download completed successfully" };
    } catch (error) {
      console.error("Download error:", error);

      // Send error message
      if (win && !win.isDestroyed()) {
        win.webContents.send("download-error", {
          url: url || "unknown",
          savePath: savePath || "unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

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