import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { SearchView } from "./pages/SearchView";
import { QueueView } from "./pages/QueueView";
import { LibraryView } from "./pages/LibraryView";
import { SettingsView } from "./pages/SettingsView";
import { useDownloadStore } from "./store/useDownloadStore";
import { ToastProvider, useToast } from "./components/ToastProvider";

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const updateDownload = useDownloadStore((state) => state.updateDownload);

  useEffect(() => {
    const handleProgress = (data: { url: string; progress: number; savePath: string }) => {
      updateDownload(data.url, { progress: data.progress, status: "downloading" });
    };

    const handleComplete = (data: { url: string; savePath: string; metadata: any }) => {
      updateDownload(data.url, { progress: 100, status: "completed" });
      showToast(`Finished: ${data.metadata?.title || "New episode"}`, "success");
      
      // Save to database
      window.electronAPI.saveRecord({
        url: data.url,
        save_path: data.savePath,
        status: "completed",
        progress: 100,
        title: data.metadata?.seriesTitle,
        season: data.metadata?.season,
        episode: data.metadata?.episode,
        thumbnail: data.metadata?.thumbnail,
        description: data.metadata?.description,
        rating: data.metadata?.rating
      });
    };

    const handleError = (data: { url: string; error: string }) => {
      updateDownload(data.url, { status: "error", error: data.error });
      showToast(`Failed: ${data.error}`, "error");
    };

    window.electronAPI.onDownloadProgress(handleProgress);
    window.electronAPI.onDownloadComplete(handleComplete);
    window.electronAPI.onDownloadError(handleError);

    const cleanupUpdate = window.electronAPI.onUpdateReady((info) => {
      showToast(`A new version (${info.version}) is ready to install!`, "success");
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        window.location.hash = "#/";
        setTimeout(() => {
          document.getElementById('main-search-input')?.focus();
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.electronAPI.removeAllDownloadListeners();
      cleanupUpdate();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateDownload, showToast]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<SearchView />} />
            <Route path="/queue" element={<QueueView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;