import React, { useState } from "react";
import { Search as SearchIcon, Play, ChevronRight, Loader2 } from "lucide-react";
import { PublicDomainSource } from "../features/sources/PublicDomainSource";
import { SeriesMetadata, EpisodeMetadata } from "../types/sources";
import { useDownloadStore, selectAddDownload } from "../store/useDownloadStore";



export const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SeriesMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesMetadata | null>(null);
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set());
  
  const addDownloadStore = useDownloadStore(selectAddDownload);
  const source = new PublicDomainSource();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const searchResults = await source.search(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleEpisode = (id: string) => {
    const next = new Set(selectedEpisodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEpisodes(next);
  };

  const selectAllEpisodes = (episodes: EpisodeMetadata[]) => {
    const next = new Set(selectedEpisodes);
    episodes.forEach(e => next.add(e.id));
    setSelectedEpisodes(next);
  };

  const handleDownload = async () => {
    if (!selectedSeries || selectedEpisodes.size === 0) return;

    // Get base download path from settings
    const settings = await window.electronAPI.getSettings();
    const basePath = settings.downloadPath || "";

    if (!basePath) {
      alert("Please set a download directory in the Settings tab first.");
      return;
    }

    // Process selected episodes
    for (const season of selectedSeries.seasons) {
      for (const episode of season.episodes) {
        if (selectedEpisodes.has(episode.id)) {
          const downloadItem = {
            id: `${episode.id}-${Date.now()}`,
            url: episode.downloadUrl,
            savePath: basePath,
            status: 'pending' as const,
            progress: 0,
            metadata: {
              title: selectedSeries.title,
              season: episode.season,
              episode: episode.number,
              episodeTitle: episode.title
            }
          };

          addDownloadStore(downloadItem);
          
          window.electronAPI.startDownload(
            episode.downloadUrl, 
            basePath, 
            {
              seriesTitle: selectedSeries.title,
              season: episode.season,
              episode: episode.number,
              episodeTitle: episode.title
            }
          );
        }
      }
    }

    // Reset selection and go back or show queue?
    setSelectedEpisodes(new Set());
    // For now, let's stay on the page but maybe show a toast
    alert(`Started ${selectedEpisodes.size} downloads! Check the Queue tab.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {!selectedSeries ? (
        <>
          <form onSubmit={handleSearch} className="relative mb-10 max-w-2xl mx-auto">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for series (e.g., Phantom)..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin w-5 h-5" />}
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {results.map((series) => (
              <div 
                key={series.id} 
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedSeries(series)}
              >
                <div className="aspect-[2/3] overflow-hidden relative">
                  <img 
                    src={series.thumbnail} 
                    alt={series.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{series.title}</h3>
                  <p className="text-sm text-amber-500 font-bold mt-1">★ {series.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setSelectedSeries(null)}
            className="mb-8 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to search
          </button>
          
          <div className="flex flex-col md:flex-row gap-10">
            <div className="w-full md:w-1/3 max-w-sm mx-auto md:mx-0">
              <img src={selectedSeries.thumbnail} className="w-full rounded-2xl shadow-2xl" alt="" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black text-gray-900 mb-2">{selectedSeries.title}</h1>
              <p className="text-xl text-amber-500 font-bold mb-6">★ {selectedSeries.rating}</p>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-8">
                <h3 className="font-bold text-blue-900 mb-2">Description</h3>
                <p className="text-blue-800/80 leading-relaxed">{selectedSeries.description}</p>
              </div>

              <div className="space-y-6">
                {selectedSeries.seasons.map((season: any) => (
                  <div key={season.number} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Season {season.number}</h2>
                      <button 
                        onClick={() => selectAllEpisodes(season.episodes)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        Select All
                      </button>
                    </div>
                  <div className="space-y-3">
                      {season.episodes.map((episode: EpisodeMetadata, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                          <input 
                            type="checkbox" 
                            checked={selectedEpisodes.has(episode.id)}
                            onChange={() => toggleEpisode(episode.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="flex-1 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{episode.title}</span>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-white text-blue-600 border border-blue-200 p-2 rounded-lg shadow-sm">
                            <Play className="w-4 h-4 fill-blue-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 flex gap-4">
                <button 
                  onClick={handleDownload}
                  disabled={selectedEpisodes.size === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:scale-[0.98]"
                >
                  Download Selected ({selectedEpisodes.size})
                </button>
                <button className="flex-1 bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-600 font-bold py-4 rounded-2xl transition-all">
                  Add to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
