import React, { useEffect, useState } from "react";
import { Folder, ExternalLink, Play, Trash2, Clock, Star } from "lucide-react";
import { PosterSkeleton } from "../components/Skeleton";

interface DownloadHistoryItem {
  id: string;
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

export const LibraryView: React.FC = () => {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DownloadHistoryItem | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await window.electronAPI.getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && selectedItem) {
        e.preventDefault();
        window.electronAPI.playFile(selectedItem.save_path);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  const parseGenres = (genresStr: string | null): string[] => {
    if (!genresStr) return [];
    try {
      return JSON.parse(genresStr);
    } catch (e) {
      return [];
    }
  };

  const handlePlay = async (e: React.MouseEvent, filePath: string | null) => {
    e.stopPropagation();
    if (!filePath) {
      alert("No file path found for this item. Is it downloaded?");
      return;
    }
    try {
      await window.electronAPI.playFile(filePath);
    } catch (error) {
      console.error("Failed to play file:", error);
      alert("Failed to play file. Error: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="h-12 w-48 bg-gray-200 animate-pulse rounded-xl mb-2" />
          <div className="h-4 w-32 bg-gray-100 animate-pulse rounded-md" />
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <PosterSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">Your Media</h1>
        <p className="text-gray-500 font-medium">{history.length} titles in your collection</p>
      </header>

      {history.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100 shadow-sm">
          <Folder className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Build your collection</h2>
          <p className="text-gray-400 max-w-xs mx-auto">Start downloading series to populate your library with ratings and posters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 ring-1 ring-gray-100">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4 text-center">
                    <Play className="w-12 h-12 text-white/20 mb-2" />
                    <span className="text-white/60 text-xs font-bold line-clamp-2 uppercase tracking-widest">{item.title}</span>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-black text-sm">{item.rating || "N/A"}</span>
                  </div>
                  <button 
                    onClick={(e) => handlePlay(e, item.save_path)}
                    className="w-full py-3 bg-white text-gray-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play
                  </button>
                </div>
                
                {(item.season !== null || item.episode !== null) && (
                  <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest ring-1 ring-white/20">
                    {item.season ? `S${item.season}` : ''} {item.episode ? `E${item.episode}` : ''}
                  </div>
                )}
              </div>
              
              <div className="mt-4 px-2">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate group-hover:text-blue-600 transition-colors">
                  {item.title || "Unknown Series"}
                </h3>
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mt-1">
                  <Clock className="w-3 h-3" />
                  {item.created_at ? new Date(item.created_at).getFullYear() : 'New'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[44px] max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-500 group/modal">
            
            {/* Backdrop Layer */}
            {selectedItem.backdrop && (
              <div className="absolute inset-0 z-0">
                <img src={selectedItem.backdrop} alt="" className="w-full h-full object-cover opacity-20 scale-105 blur-2xl transition-transform duration-1000 group-hover/modal:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
              </div>
            )}

            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-8 right-8 p-3 bg-gray-100/50 hover:bg-white hover:text-red-500 rounded-full transition-all z-20 shadow-sm backdrop-blur-md border border-white/20"
            >
              <Trash2 className="w-5 h-5" /> 
            </button>

            <div className="w-full md:w-[400px] aspect-[2/3] relative z-10 p-10 md:pr-0">
               <div className="relative h-full w-full rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/20">
                {selectedItem.thumbnail ? (
                    <img src={selectedItem.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                      <Play className="w-16 h-16 text-white/20" />
                    </div>
                  )}
               </div>
            </div>

            <div className="p-12 flex-1 flex flex-col relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20">
                  {selectedItem.status}
                </span>
                <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                   <span className="font-black text-gray-900 text-sm tracking-tight">{selectedItem.rating || "No Rating"}</span>
                </div>
              </div>

              <h2 className="text-5xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tighter">
                {selectedItem.title}
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {parseGenres(selectedItem.genres).map(genre => (
                  <span key={genre} className="bg-gray-100/80 backdrop-blur-sm text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/20">
                    {genre}
                  </span>
                ))}
              </div>

              {(selectedItem.season !== null || selectedItem.episode !== null) && (
                <p className="text-blue-600 font-black mb-8 uppercase tracking-[0.2em] text-xs">
                  {selectedItem.season ? `Season ${selectedItem.season}` : ''} {selectedItem.episode ? `· Episode ${selectedItem.episode}` : ''}
                </p>
              )}

              <div className="flex-1 overflow-y-auto pr-4 mb-8 custom-scrollbar">
                <h4 className="text-gray-400 uppercase text-[9px] font-black tracking-[0.3em] mb-3">Synopsis</h4>
                <p className="text-gray-700/80 leading-relaxed font-medium text-lg">
                  {selectedItem.description || "No description available for this title."}
                </p>
              </div>

              <div className="bg-gray-50/50 backdrop-blur-md p-5 rounded-3xl border border-white mb-10 group/path cursor-default transition-all hover:bg-white shadow-sm">
                <div className="flex items-center gap-4 text-xs text-gray-400 font-mono italic">
                  <div className="p-2 bg-gray-100 rounded-xl group-hover/path:bg-blue-50 group-hover/path:text-blue-500 transition-colors">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="truncate">{selectedItem.save_path}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={(e) => handlePlay(e, selectedItem.save_path)}
                  className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[24px] shadow-2xl shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-3 transform hover:-translate-y-1"
                >
                  <Play className="w-6 h-6 fill-current" /> 
                  <span className="uppercase tracking-widest text-sm">Watch Now</span>
                </button>
                <button className="px-7 py-5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 font-black rounded-[24px] transition-all border border-gray-100 shadow-sm transform hover:-translate-y-1">
                   <ExternalLink className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
