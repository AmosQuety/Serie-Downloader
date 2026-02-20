import { autoUpdater } from "electron-updater";
import { logInfo, logError } from "./logger";
import { BrowserWindow } from "electron";

export class UpdateManager {
  private window: BrowserWindow | null = null;

  constructor(window: BrowserWindow) {
    this.window = window;
    this.setupListeners();
  }

  private setupListeners() {
    autoUpdater.on("checking-for-update", () => {
      logInfo("Checking for update...");
    });

    autoUpdater.on("update-available", (info) => {
      logInfo(`Update available: ${info.version}`);
      this.window?.webContents.send("update-available", info);
    });

    autoUpdater.on("update-not-available", (info) => {
      logInfo(`Update not available: ${info.version}`);
    });

    autoUpdater.on("error", (err) => {
      logError("Error in auto-updater: ", err);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + " - Downloaded " + progressObj.percent + "%";
      log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
      logInfo(log_message);
    });

    autoUpdater.on("update-downloaded", (info) => {
      logInfo("Update downloaded");
      this.window?.webContents.send("update-ready", info);
    });
  }

  public checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }
}
