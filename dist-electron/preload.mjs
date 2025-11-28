"use strict";
const electron = require("electron");
const electronAPI = {
  // Show save dialog
  showSaveDialog: async (options) => {
    try {
      const result = await electron.ipcRenderer.invoke("show-save-dialog", options || {});
      return result;
    } catch (error) {
      console.error("Failed to show save dialog:", error);
      return {
        canceled: true,
        filePath: null,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  // Start download function using invoke for async response
  startDownload: async (url, savePath) => {
    try {
      const result = await electron.ipcRenderer.invoke("start-download", { url, savePath });
      return result;
    } catch (error) {
      console.error("Failed to start download:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  // Progress listener with automatic cleanup
  onDownloadProgress: (callback) => {
    const wrappedCallback = (_event, data) => {
      callback(data);
    };
    electron.ipcRenderer.on("download-progress", wrappedCallback);
    return () => {
      electron.ipcRenderer.removeListener("download-progress", wrappedCallback);
    };
  },
  // Complete listener with automatic cleanup
  onDownloadComplete: (callback) => {
    const wrappedCallback = (_event, data) => {
      callback(data);
    };
    electron.ipcRenderer.on("download-complete", wrappedCallback);
    return () => {
      electron.ipcRenderer.removeListener("download-complete", wrappedCallback);
    };
  },
  // Error listener with automatic cleanup
  onDownloadError: (callback) => {
    const wrappedCallback = (_event, data) => {
      callback(data);
    };
    electron.ipcRenderer.on("download-error", wrappedCallback);
    return () => {
      electron.ipcRenderer.removeListener("download-error", wrappedCallback);
    };
  },
  // Remove all download-related listeners
  removeAllDownloadListeners: () => {
    electron.ipcRenderer.removeAllListeners("download-progress");
    electron.ipcRenderer.removeAllListeners("download-complete");
    electron.ipcRenderer.removeAllListeners("download-error");
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
