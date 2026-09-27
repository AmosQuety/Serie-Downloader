import { app, BrowserWindow, Menu } from "electron";
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
import type BetterSqlite3 from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

import DownloadManager from "./DownloadManager";
import Store from "electron-store";
import { logInfo, logError } from "./logger";
import { registerAllIpcHandlers } from "./ipc";

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
const db: BetterSqlite3.Database = new Database(dbPath);

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
    backdrop TEXT,
    genres TEXT,
    description TEXT,
    rating TEXT,
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    thumbnail TEXT,
    backdrop TEXT,
    genres TEXT,
    rating TEXT,
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    series_id TEXT,
    title TEXT,
    season INTEGER,
    number INTEGER,
    download_url TEXT,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    save_path TEXT,
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(series_id) REFERENCES series(id)
  );

  CREATE TABLE IF NOT EXISTS playback_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE,
    last_position REAL DEFAULT 0,
    duration REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

import { UpdateManager } from "./UpdateManager";

// migration for existing systems
try {
  db.exec(`
    ALTER TABLE download_history ADD COLUMN backdrop TEXT;
    ALTER TABLE download_history ADD COLUMN genres TEXT;
    ALTER TABLE download_history ADD COLUMN thumbnail TEXT;
    ALTER TABLE download_history ADD COLUMN description TEXT;
    ALTER TABLE download_history ADD COLUMN rating TEXT;
    ALTER TABLE download_history ADD COLUMN source_id TEXT;
    ALTER TABLE series ADD COLUMN backdrop TEXT;
    ALTER TABLE series ADD COLUMN genres TEXT;
  `);
} catch (e) {
  // columns probably exist
}

// ----------------------
// IPC Handlers
// ----------------------

function setupIPCHandlers() {
  registerAllIpcHandlers({
    getWindow: () => win,
    db,
    store,
    downloadManager,
  });
}

// ----------------------
// Auto-Resume Logic
// ----------------------

interface PendingEpisode {
  download_url: string;
  save_path: string;
}

async function resumePendingTasks() {
  try {
    const pending = db.prepare("SELECT * FROM episodes WHERE status = 'pending' OR status = 'downloading'").all() as PendingEpisode[];
    logInfo(`Auto-resume: Found ${pending.length} pending tasks.`);
    
    for (const ep of pending) {
      downloadManager.downloadFile(ep.download_url, ep.save_path, (progress) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send("download-progress", {
            url: ep.download_url,
            progress: progress,
            savePath: ep.save_path,
          });
        }
      });
    }
  } catch (error) {
    logError("Auto-resume failed", error);
  }
}
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
    
    // Check for updates
    const updateManager = new UpdateManager(win!);
    updateManager.checkForUpdates();
  });

  const setupMenu = () => {
    Menu.setApplicationMenu(null);
  };

  setupMenu();

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
  // 1. Remove default menus for native feel
  Menu.setApplicationMenu(null);

  // 2. Setup IPC and Create window
  setupIPCHandlers();
  createWindow();

  // 3. Initialize auto-resume for unfinished downloads
  resumePendingTasks();
});