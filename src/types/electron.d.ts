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

  // Playback
  playFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getPlaybackPosition: (filePath: string) => Promise<number>;
  updatePlaybackPosition: (data: { filePath: string, position: number, duration: number }) => Promise<{ success: boolean }>;

  // Updates
  onUpdateReady: (callback: (info: any) => void) => () => void;

  // Source Search & Metadata
  searchSources: (query: string) => Promise<any[]>;
  getSeasonLinks: (sourceId: string, seriesId: string) => Promise<any[]>;
  getEpisodes: (sourceId: string, seriesId: string, seasonNumber: number) => Promise<any[]>;
  getSourceDownloadUrl: (sourceId: string, episodeId: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
