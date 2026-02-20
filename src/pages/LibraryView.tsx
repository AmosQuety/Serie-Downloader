import React, { useEffect, useState } from "react";
import { Folder, ExternalLink, Play, Trash2, Clock, Star, Info } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-black text-sm">{item.rating || "N/A"}</span>
                  </div>
                  <button className="w-full py-3 bg-white text-gray-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <Play className="w-4 h-4 fill-current" /> Play
                  </button>
                </div>
                
                {item.season && (
                  <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest ring-1 ring-white/20">
                    S{item.season} E{item.episode}
                  </div>
                )}
              </div>
              
              <div className="mt-4 px-2">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate group-hover:text-blue-600 transition-colors">
                  {item.title || "Unknown Series"}
                </h3>
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).getFullYear()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-500">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <Trash2 className="w-5 h-5 text-gray-500" /> 
            </button>

            <div className="w-full md:w-2/5 aspect-[2/3] relative">
               {selectedItem.thumbnail ? (
                  <img src={selectedItem.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600" />
                )}
            </div>

            <div className="p-10 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                  {selectedItem.status}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                   <span className="font-bold text-gray-900">{selectedItem.rating || "No Rating"}</span>
                </div>
              </div>

              <h2 className="text-4xl font-black text-gray-900 mb-2 leading-tight">
                {selectedItem.title}
              </h2>
              <p className="text-blue-600 font-bold mb-6">
                Season {selectedItem.season} Episode {selectedItem.episode}
              </p>

              <div className="flex-1">
                <h4 className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed mb-6 font-medium italic">
                  "{selectedItem.description || "No description available for this title."}"
                </p>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-mono break-all">
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    {selectedItem.save_path}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                  <Play className="w-5 h-5 fill-current" /> Watch Now
                </button>
                <button className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all">
                   <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
