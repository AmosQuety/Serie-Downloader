import React, { useState, useEffect } from "react";
import { Folder, Save, Undo, CheckCircle, Info } from "lucide-react";

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<{ downloadPath: string, maxSpeed: number }>({ 
    downloadPath: "", 
    maxSpeed: 0 // 0 = unlimited
  });
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const currentSettings = await window.electronAPI.getSettings();
      setSettings({
        downloadPath: currentSettings.downloadPath || "",
        maxSpeed: currentSettings.maxSpeed || 0
      });
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSelectDirectory = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setSettings({ ...settings, downloadPath: path });
      setIsSaved(false);
    }
  };

  const handleSave = async () => {
    await window.electronAPI.updateSettings("downloadPath", settings.downloadPath);
    await window.electronAPI.updateSettings("maxSpeed", settings.maxSpeed);
    await (window.electronAPI as any).setMaxSpeed(settings.maxSpeed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatSpeed = (kbps: number) => {
    if (kbps === 0) return "Unlimited";
    if (kbps < 1024) return `${kbps} KB/s`;
    return `${(kbps / 1024).toFixed(1)} MB/s`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500">Customize your downloader experience</p>
      </header>

      <div className="space-y-8">
        {/* Download Path Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Download Location</h2>
              <p className="text-gray-500 text-sm">Where your organized series will be saved</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full font-mono text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 truncate">
              {settings.downloadPath}
            </div>
            <button
              onClick={handleSelectDirectory}
              className="w-full md:w-auto px-6 py-3 bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 font-bold rounded-xl transition-all"
            >
              Change Folder
            </button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl flex gap-3 text-amber-800 text-sm">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>
              Your series will be automatically organized into 
              <span className="font-bold"> [Series Title]/Season [XX]/[Episode Title]</span> subfolders 
              within this directory.
            </p>
          </div>
        </section>

        {/* Throttling Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-purple-50 p-3 rounded-2xl">
              <div className="w-6 h-6 text-purple-600">⚡</div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Bandwidth Control</h2>
              <p className="text-gray-500 text-sm">Limit the maximum download speed</p>
            </div>
            <div className="text-xl font-black text-purple-600 font-mono">
              {formatSpeed(settings.maxSpeed)}
            </div>
          </div>

          <div className="space-y-6">
            <input 
              type="range"
              min="0"
              max="10240"
              step="512"
              value={settings.maxSpeed}
              onChange={(e) => {
                setSettings({...settings, maxSpeed: parseInt(e.target.value)});
                setIsSaved(false);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <span>Unlimited</span>
              <span>5 MB/s</span>
              <span>10 MB/s</span>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex justify-end gap-4 p-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-gray-500 font-medium hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <Undo className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-10 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
              isSaved 
                ? "bg-green-500 text-white shadow-green-500/20" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:-translate-y-0.5"
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-5 h-5" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
