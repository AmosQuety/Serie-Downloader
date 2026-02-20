export interface DownloadItem {
  id: string;
  url: string;
  savePath: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  metadata?: {
    title?: string;
    season?: number;
    episode?: number;
  };
}

export interface DownloadProgressData {
  url: string;
  progress: number;
  savePath: string;
}

export interface DownloadCompleteData {
  url: string;
  savePath: string;
  success: boolean;
  metadata?: any;
}

export interface DownloadErrorData {
  url: string;
  savePath: string;
  error: string;
}
