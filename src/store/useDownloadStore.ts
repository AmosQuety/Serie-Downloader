import { create } from 'zustand';
import { DownloadItem } from '../types';

interface DownloadState {
  downloads: DownloadItem[];
  addDownload: (item: DownloadItem) => void;
  updateDownload: (url: string, updates: Partial<DownloadItem>) => void;
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
  clearHistory: () => set({ downloads: [] }),
}));

// Selectors for performance
export const selectDownloads = (state: DownloadState) => state.downloads;
export const selectUpdateDownload = (state: DownloadState) => state.updateDownload;
export const selectAddDownload = (state: DownloadState) => state.addDownload;
