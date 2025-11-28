import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Define the API interface for type safety
export interface ElectronAPI {
  // Download functions
  startDownload: (url: string, savePath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Progress listeners
  onDownloadProgress: (callback: (data: { url: string; progress: number; savePath: string }) => void) => () => void;
  onDownloadComplete: (callback: (data: { url: string; savePath: string; success: boolean }) => void) => () => void;
  onDownloadError: (callback: (data: { url: string; savePath: string; error: string }) => void) => () => void;
  
  // Utility function to remove all download listeners
  removeAllDownloadListeners: () => void;
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
  startDownload: async (url: string, savePath: string) => {
    try {
      const result = await ipcRenderer.invoke("start-download", { url, savePath });
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
  onDownloadComplete: (callback: (data: { url: string; savePath: string; success: boolean }) => void) => {
    const wrappedCallback = (_event: IpcRendererEvent, data: { url: string; savePath: string; success: boolean }) => {
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
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Export the type for use in renderer TypeScript files
export type { ElectronAPI };