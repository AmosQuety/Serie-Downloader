import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Define the API interface for type safety
export interface ElectronAPI {
  // Download functions
  startDownload: (url: string, savePath: string, metadata?: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Progress listeners
  onDownloadProgress: (callback: (data: { url: string; progress: number; savePath: string }) => void) => () => void;
  onDownloadComplete: (callback: (data: { url: string; savePath: string; success: boolean; metadata: any }) => void) => () => void;
  onDownloadError: (callback: (data: { url: string; savePath: string; error: string }) => void) => () => void;
  
  // Download controls
  pauseDownload: (url: string) => Promise<{ success: boolean; error?: string }>;
  cancelDownload: (url: string) => Promise<{ success: boolean; error?: string }>;

  // Database functions
  getHistory: () => Promise<any[]>;
  saveRecord: (record: any) => Promise<{ success: boolean; error?: string }>;

  // Settings & Configuration
  getSettings: () => Promise<any>;
  updateSettings: (key: string, value: any) => Promise<void>;
  selectDirectory: () => Promise<string | null>;

  // Dialogs
  showSaveDialog: (options?: { defaultPath?: string }) => Promise<{ canceled: boolean; filePath: string | null; error?: string }>;

  // Utility function to remove all download listeners
  removeAllDownloadListeners: () => void;

  // Bulk Database insertion
  bulkInsertEpisodes: (data: { series: any, episodes: any[], sourceId: string }) => Promise<{ success: boolean; error?: string }>;

  // Throttling
  setMaxSpeed: (speed: number) => Promise<void>;

  // Source Search & Metadata
  searchSources: (query: string) => Promise<any[]>;
  getSeasonLinks: (sourceId: string, seriesId: string) => Promise<any[]>;
  getEpisodes: (sourceId: string, seriesId: string, seasonNumber: number) => Promise<any[]>;
  getSourceDownloadUrl: (sourceId: string, episodeId: string) => Promise<string>;

  // Playback
  playFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getPlaybackPosition: (filePath: string) => Promise<number>;
  updatePlaybackPosition: (data: { filePath: string, position: number, duration: number }) => Promise<{ success: boolean }>;

  // Updates
  onUpdateReady: (callback: (info: any) => void) => () => void;
}

// Create the API object
const electronAPI: ElectronAPI = {
  // Show save dialog
  showSaveDialog: async (options?: { defaultPath?: string }) => {
    try {
      const result = await ipcRenderer.invoke("show-save-dialog", options || {});
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
  startDownload: async (url: string, savePath: string, metadata?: any) => {
    try {
      const result = await ipcRenderer.invoke("start-download", { url, savePath, metadata });
      return result;
    } catch (error) {
      console.error("Failed to start download:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },

  // Database bridge
  getHistory: async () => {
    return await ipcRenderer.invoke("get-download-history");
  },

  saveRecord: async (record: any) => {
    return await ipcRenderer.invoke("save-download-record", record);
  },

  // Settings bridge
  getSettings: async () => {
    return await ipcRenderer.invoke("get-settings");
  },

  updateSettings: async (key: string, value: any) => {
    await ipcRenderer.invoke("set-setting", { key, value });
  },

  selectDirectory: async () => {
    return await ipcRenderer.invoke("select-directory");
  },

  // Progress listener with automatic cleanup
  onDownloadProgress: (callback: (data: { url: string; progress: number; savePath: string }) => void) => {
    const wrappedCallback = (_event: IpcRendererEvent, data: { url: string; progress: number; savePath: string }) => {
      callback(data);
    };
    
    ipcRenderer.on("download-progress", wrappedCallback);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener("download-progress", wrappedCallback);
    };
  },

  // Complete listener with automatic cleanup
  onDownloadComplete: (callback: (data: { url: string; savePath: string; success: boolean; metadata: any }) => void) => {
    const wrappedCallback = (_event: IpcRendererEvent, data: { url: string; savePath: string; success: boolean; metadata: any }) => {
      callback(data);
    };
    
    ipcRenderer.on("download-complete", wrappedCallback);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener("download-complete", wrappedCallback);
    };
  },

  // Error listener with automatic cleanup
  onDownloadError: (callback: (data: { url: string; savePath: string; error: string }) => void) => {
    const wrappedCallback = (_event: IpcRendererEvent, data: { url: string; savePath: string; error: string }) => {
      callback(data);
    };
    
    ipcRenderer.on("download-error", wrappedCallback);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener("download-error", wrappedCallback);
    };
  },

  // Remove all download-related listeners
  removeAllDownloadListeners: () => {
    ipcRenderer.removeAllListeners("download-progress");
    ipcRenderer.removeAllListeners("download-complete");
    ipcRenderer.removeAllListeners("download-error");
  },

  cancelDownload: async (url: string) => {
    return await ipcRenderer.invoke("cancel-download", { url });
  },

  pauseDownload: async (url: string) => {
    return await ipcRenderer.invoke("pause-download", { url });
  },

  bulkInsertEpisodes: async (data: { series: any, episodes: any[], sourceId: string }) => {
    return await ipcRenderer.invoke("bulk-insert-episodes", data);
  },

  setMaxSpeed: async (speed: number) => {
    await ipcRenderer.invoke("set-max-speed", speed);
  },

  searchSources: async (query: string) => {
    return await ipcRenderer.invoke("search-sources", query);
  },

  getSeasonLinks: async (sourceId: string, seriesId: string) => {
    return await ipcRenderer.invoke("get-season-links", { sourceId, seriesId });
  },

  getEpisodes: async (sourceId: string, seriesId: string, seasonNumber: number) => {
    return await ipcRenderer.invoke("get-episodes", { sourceId, seriesId, seasonNumber });
  },

  getSourceDownloadUrl: async (sourceId: string, episodeId: string) => {
    return await ipcRenderer.invoke("get-source-download-url", { sourceId, episodeId });
  },

  // Playback bridge
  playFile: async (filePath: string) => {
    return await ipcRenderer.invoke("play-file", filePath);
  },

  getPlaybackPosition: async (filePath: string) => {
    return await ipcRenderer.invoke("get-playback-position", filePath);
  },

  updatePlaybackPosition: async (data: { filePath: string, position: number, duration: number }) => {
    return await ipcRenderer.invoke("update-playback-position", data);
  },

  onUpdateReady: (callback: (info: any) => void) => {
    const wrappedCallback = (_event: IpcRendererEvent, info: any) => {
      callback(info);
    };
    ipcRenderer.on("update-ready", wrappedCallback);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener("update-ready", wrappedCallback);
    };
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", electronAPI);