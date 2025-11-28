// types/electron.d.ts
export interface ElectronAPI {
  // Download functions
  startDownload: (
    url: string,
    savePath: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Progress listeners
  onDownloadProgress: (
    callback: (data: {
      url: string;
      progress: number;
      savePath: string;
    }) => void
  ) => () => void;
  onDownloadComplete: (
    callback: (data: {
      url: string;
      savePath: string;
      success: boolean;
    }) => void
  ) => () => void;
  onDownloadError: (
    callback: (data: { url: string; savePath: string; error: string }) => void
  ) => () => void;

  // Utility function to remove all download listeners
  removeAllDownloadListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
