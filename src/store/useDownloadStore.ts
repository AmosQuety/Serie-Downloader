import { create } from 'zustand';
import { DownloadItem } from '../types';

interface DownloadState {
  downloads: DownloadItem[];
  addDownload: (item: DownloadItem) => void;
  updateDownload: (url: string, updates: Partial<DownloadItem>) => void;
  removeDownload: (url: string) => void;
  clearHistory: () => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  downloads: [],
  addDownload: (item) => set((state) => ({ 
    downloads: [item, ...state.downloads] 
  })),
  updateDownload: (url, updates) => set((state) => ({
    downloads: state.downloads.map((d) => 
      d.url === url ? { ...d, ...updates } : d
    )
  })),
  removeDownload: (url) => set((state) => ({
    downloads: state.downloads.filter((d) => d.url !== url)
  })),
  clearHistory: () => set({ downloads: [] }),
}));

// Selectors for performance
export const selectDownloads = (state: DownloadState) => state.downloads;
export const selectUpdateDownload = (state: DownloadState) => state.updateDownload;
export const selectRemoveDownload = (state: DownloadState) => state.removeDownload;
export const selectAddDownload = (state: DownloadState) => state.addDownload;
