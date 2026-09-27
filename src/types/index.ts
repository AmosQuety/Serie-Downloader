import type { PathMetadata } from '../../electron/pathUtils';

export type { PathMetadata };

export interface DownloadItem {
  id: string;
  url: string;
  savePath: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
  backdrop?: string;
  genres?: string[];
  metadata?: {
    title?: string;
    season?: number;
    episode?: number;
    episodeTitle?: string;
  };
}

export interface DownloadProgressData {
  url: string;
  progress: number;
  savePath: string;
}

export interface DownloadCompleteMetadata {
  seriesTitle?: string;
  title?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  thumbnail?: string;
  description?: string;
  rating?: string;
}

export interface DownloadCompleteData {
  url: string;
  savePath: string;
  success: boolean;
  metadata?: DownloadCompleteMetadata;
}

export interface DownloadErrorData {
  url: string;
  savePath: string;
  error: string;
}

export interface DownloadRecord {
  url: string;
  save_path: string;
  status: string;
  progress: number;
  title?: string;
  season?: number;
  episode?: number;
  thumbnail?: string;
  description?: string;
  rating?: string;
  source_id?: string;
}

export interface DownloadHistoryItem {
  id: number;
  url: string;
  save_path: string;
  status: string;
  progress: number;
  title: string | null;
  season: number | null;
  episode: number | null;
  thumbnail: string | null;
  backdrop: string | null;
  genres: string | null; // stored as JSON string in SQLite
  description: string | null;
  rating: string | null;
  created_at: string;
}

export interface AppSettings {
  downloadPath?: string;
  maxSpeed?: number;
  tmdbApiKey?: string;
  omdbApiKey?: string;
}

export interface UpdateReadyInfo {
  version: string;
}
