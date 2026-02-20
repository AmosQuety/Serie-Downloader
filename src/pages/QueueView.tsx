import React from "react";
import { useDownloadStore, selectDownloads, selectUpdateDownload, selectRemoveDownload } from "../store/useDownloadStore";
import { List, Pause, Play, Trash2, RotateCcw, AlertCircle, Loader2 } from "lucide-react";

export const QueueView: React.FC = () => {
  const downloads = useDownloadStore(selectDownloads);
  const updateDownload = useDownloadStore(selectUpdateDownload);
  const removeDownload = useDownloadStore(selectRemoveDownload);

  const handleRetry = (url: string, item: any) => {
    updateDownload(url, { status: 'pending', progress: 0, error: undefined });
    window.electronAPI.startDownload(url, item.savePath, {
      seriesTitle: item.metadata?.title || "Unknown",
      season: item.metadata?.season,
      episode: item.metadata?.episode,
      episodeTitle: item.metadata?.episodeTitle
    });
  };

  const handlePause = async (url: string) => {
    const download = downloads.find(d => d.url === url);
    if (!download) return;

    if (download.status === 'paused') {
      // Resume logic - acts like retry
      handleRetry(url, download);
    } else {
      const result = await window.electronAPI.pauseDownload(url);
      if (result.success) {
        updateDownload(url, { status: 'paused' });
      }
    }
  };

  const handleDelete = async (url: string) => {
    const result = await window.electronAPI.cancelDownload(url);
    if (result.success) {
      removeDownload(url);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading': return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'paused': return <Pause className="w-5 h-5 text-amber-600" />;
      default: return <List className="w-5 h-5 text-gray-400" />;
    }
  };

  const activeDownloads = downloads.filter(d => d.status !== 'completed');
  const completedCount = downloads.filter(d => d.status === 'completed').length;

  const handlePauseAll = () => {
    activeDownloads.forEach(d => {
      if (d.status === 'downloading') handlePause(d.url);
    });
  };

  const handleResumeAll = () => {
    activeDownloads.forEach(d => {
      if (d.status === 'paused' || d.status === 'error') handleRetry(d.url, d);
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Download Queue</h1>
          <p className="text-gray-500">
            {activeDownloads.length} active downloads · {completedCount} finished
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePauseAll}
            className="px-6 py-2.5 bg-white border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 text-gray-600 font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Pause size={18} /> Pause All
          </button>
          <button 
            onClick={handleResumeAll}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Play size={18} /> Resume All
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {activeDownloads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <List className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No active downloads in the queue.</p>
          </div>
        ) : (
          activeDownloads.map((download) => (
            <div key={download.id} className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
              download.status === 'error' ? 'border-red-100 bg-red-50/10' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${
                  download.status === 'error' ? 'bg-red-50' : 
                  download.status === 'downloading' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  {getStatusIcon(download.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 truncate">
                      {download.metadata?.title || "File"}
                    </h3>
                    <span className={`text-sm font-black ${
                      download.status === 'error' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {download.status === 'error' ? 'FAILED' : 
                       download.status === 'paused' ? 'PAUSED' : `${download.progress}%`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {download.metadata?.episodeTitle || "Download"}
                  </p>
                </div>
              </div>

              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                    download.status === 'error' ? 'bg-red-500' : 
                    download.status === 'paused' ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${download.progress}%` }}
                />
              </div>

              {download.error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex gap-2 items-center">
                  <AlertCircle size={14} />
                  {download.error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {download.status === 'error' && (
                  <button 
                    onClick={() => handleRetry(download.url, download)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Retry Now
                  </button>
                )}
                <button 
                  onClick={() => handlePause(download.url)}
                  className={`p-2 rounded-lg transition-colors ${
                    download.status === 'paused' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {download.status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button 
                  onClick={() => handleDelete(download.url)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Internal icon helper
const CheckCircle = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
