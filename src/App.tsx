import React, { useState, useEffect, useCallback } from "react";
import { Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DownloadProgress {
  url: string;
  progress: number;
  savePath: string;
  status: "downloading" | "completed" | "error";
  error?: string;
}

const App: React.FC = () => {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [url, setUrl] = useState("");
  const [savePath, setSavePath] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Setup listeners on component mount
  useEffect(() => {
    if (!window.electronAPI) {
      console.warn("Electron API not available");
      return;
    }

    // Setup progress listener
    const progressCleanup = window.electronAPI.onDownloadProgress((data) => {
      setDownloads((prev) => {
        const existing = prev.find((d) => d.url === data.url);
        if (existing) {
          return prev.map((d) =>
            d.url === data.url
              ? {
                  ...d,
                  progress: data.progress,
                  status: "downloading" as const,
                }
              : d
          );
        } else {
          return [
            ...prev,
            {
              url: data.url,
              progress: data.progress,
              savePath: data.savePath,
              status: "downloading" as const,
            },
          ];
        }
      });
    });

    // Setup completion listener
    const completeCleanup = window.electronAPI.onDownloadComplete((data) => {
      setDownloads((prev) =>
        prev.map((d) =>
          d.url === data.url
            ? { ...d, progress: 100, status: "completed" as const }
            : d
        )
      );
      setIsDownloading(false);
    });

    // Setup error listener
    const errorCleanup = window.electronAPI.onDownloadError((data) => {
      setDownloads((prev) =>
        prev.map((d) =>
          d.url === data.url
            ? { ...d, status: "error" as const, error: data.error }
            : d
        )
      );
      setIsDownloading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      progressCleanup();
      completeCleanup();
      errorCleanup();
    };
  }, []);

  const handleStartDownload = useCallback(async () => {
    if (!url.trim() || !savePath.trim()) {
      alert("Please provide both URL and save path");
      return;
    }

    if (!window.electronAPI) {
      alert("Electron API not available");
      return;
    }

    setIsDownloading(true);

    try {
      const result = await window.electronAPI.startDownload(
        url.trim(),
        savePath.trim()
      );

      if (!result.success) {
        console.error("Download failed:", result.error);
        setIsDownloading(false);
        // Add error entry to downloads list
        setDownloads((prev) => [
          ...prev,
          {
            url: url.trim(),
            progress: 0,
            savePath: savePath.trim(),
            status: "error",
            error: result.error || "Unknown error",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to start download:", error);
      setIsDownloading(false);
    }
  }, [url, savePath]);

  const clearDownloads = () => {
    setDownloads([]);
  };

  const getStatusIcon = (download: DownloadProgress) => {
    switch (download.status) {
      case "downloading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (download: DownloadProgress) => {
    switch (download.status) {
      case "downloading":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const useTestUrl = (testUrl: string, testPath: string) => {
    setUrl(testUrl);
    setSavePath(testPath);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Download Manager
          </h1>
          <p className="text-lg text-gray-600">
            Manage your file downloads with progress tracking
          </p>
        </div>

        {/* API Status */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex items-center gap-2">
            {window.electronAPI ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Electron API: {window.electronAPI ? "Connected" : "Not Available"}
            </span>
          </div>
        </div>

        {/* Download Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Start New Download
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Download URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/file.zip"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isDownloading}
              />
            </div>

            <div>
              <label
                htmlFor="savePath"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Save Path
              </label>
              <input
                id="savePath"
                type="text"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
                placeholder="./downloads/myfile.zip"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isDownloading}
              />
            </div>

            <button
              onClick={handleStartDownload}
              disabled={isDownloading || !url.trim() || !savePath.trim() || !window.electronAPI}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isDownloading ? "Starting Download..." : "Start Download"}
            </button>
          </div>
        </div>

        {/* Downloads List */}
        {downloads.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Download History
              </h2>
              <button
                onClick={clearDownloads}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {downloads.map((download, index) => (
                <div
                  key={`${download.url}-${index}`}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(download)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {download.url}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {download.savePath}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {download.progress}%
                      </p>
                      {download.status === "error" && download.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {download.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
                        download
                      )}`}
                      style={{ width: `${download.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test URLs - Working Examples */}
        <div className="bg-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Test URLs (Working Examples)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="font-medium text-gray-900">Small File (1MB)</p>
              <p className="text-sm text-gray-600 font-mono break-all mb-3">
                https://httpbin.org/bytes/1048576
              </p>
              <button 
                onClick={() => useTestUrl('https://httpbin.org/bytes/1048576', './test-1mb.bin')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={isDownloading}
              >
                Use This URL
              </button>
            </div>
            
            <div className="bg-white rounded-xl p-4">
              <p className="font-medium text-gray-900">JSON Data</p>
              <p className="text-sm text-gray-600 font-mono break-all mb-3">
                https://jsonplaceholder.typicode.com/posts
              </p>
              <button 
                onClick={() => useTestUrl('https://jsonplaceholder.typicode.com/posts', './posts.json')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={isDownloading}
              >
                Use This URL
              </button>
            </div>

            <div className="bg-white rounded-xl p-4">
              <p className="font-medium text-gray-900">Random Image</p>
              <p className="text-sm text-gray-600 font-mono break-all mb-3">
                https://picsum.photos/800/600
              </p>
              <button 
                onClick={() => useTestUrl('https://picsum.photos/800/600', './random-image.jpg')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={isDownloading}
              >
                Use This URL
              </button>
            </div>

            <div className="bg-white rounded-xl p-4">
              <p className="font-medium text-gray-900">Large File (10MB)</p>
              <p className="text-sm text-gray-600 font-mono break-all mb-3">
                https://httpbin.org/bytes/10485760
              </p>
              <button 
                onClick={() => useTestUrl('https://httpbin.org/bytes/10485760', './test-10mb.bin')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={isDownloading}
              >
                Use This URL
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 File Selection Tips:</strong>
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Click "Browse" to choose where to save your file using a native file dialog</li>
              <li>Use "Use + Browse" buttons below to auto-fill URL and pick save location</li>
              <li>The file extension will be auto-detected when possible</li>
            </ul>
          </div>

          <div className="mt-3 p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800 mb-2">
              <strong>⚠️ About 403 Errors:</strong>
            </p>
            <p className="text-sm text-amber-700">
              If you get a "403 Forbidden" error, the URL requires authentication or has access restrictions. Try the test URLs below for guaranteed working downloads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;