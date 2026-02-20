import React, { useState } from "react";
import { Search as SearchIcon, Play, ChevronRight, Loader2, Info } from "lucide-react";
import { SeriesMetadata, EpisodeMetadata } from "../types/sources";
import { useDownloadStore, selectAddDownload } from "../store/useDownloadStore";
import { useToast } from "../components/ToastProvider";
import { PosterSkeleton } from "../components/Skeleton";

export const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SeriesMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesMetadata | null>(null);
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Direct Download State
  const [mode, setMode] = useState<'search' | 'direct'>('search');
  const [directUrl, setDirectUrl] = useState("");
  const [directTitle, setDirectTitle] = useState("");
  const [isStartingDirect, setIsStartingDirect] = useState(false);
  
  const addDownloadStore = useDownloadStore(selectAddDownload);
  const { showToast } = useToast();

  // Initial load: Fetch trending items
  React.useEffect(() => {
    if (isInitialLoad) {
      handleSearch(null);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  const handleSearch = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    
    setIsSearching(true);
    try {
      // If query is empty, focus on ArchiveOrg (as it has a better "browse" structure)
      const query = searchQuery.trim() || "*"; 
      const allSourceResults = await window.electronAPI.searchSources(query);
      const flattened = allSourceResults.flatMap((r: any) => r.results);
      setResults(flattened);
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

    const settings = await window.electronAPI.getSettings();
    const basePath = settings.downloadPath || "";

    if (!basePath) {
      alert("Please set a download directory in the Settings tab first.");
      return;
    }

    // Process selected episodes
    const episodesToInsert: EpisodeMetadata[] = [];
    
    for (const season of selectedSeries.seasons) {
      for (const episode of season.episodes) {
        if (selectedEpisodes.has(episode.id)) {
          episodesToInsert.push(episode);
          
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

    // Call Bulk Insert IPC
    try {
      await window.electronAPI.bulkInsertEpisodes({
        series: selectedSeries,
        episodes: episodesToInsert,
        sourceId: selectedSeries.sourceId
      });
    } catch (error) {
      console.error("Bulk insert failed:", error);
    }

    setSelectedEpisodes(new Set());
    alert(`Started ${selectedEpisodes.size} downloads! Check the Queue tab.`);
  };

  const getSourceName = (id: string) => {
    const names: Record<string, string> = {
      'archive-org': 'Internet Archive',
      'loc-gov': 'Library of Congress',
      'pd-movie': 'PD Movie Source',
      'youtube-pd': 'YouTube PD',
      'nfb-ca': 'NFB Canada',
      'nasa-stock': 'NASA Stock',
      'open-culture': 'Open Culture',
      'british-council': 'British Council',
      'vimeo-cc': 'Vimeo CC',
      'pratt-archive': 'Pratt Archive'
    };
    return names[id] || id;
  };
  
  const handleDirectDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    const settings = await window.electronAPI.getSettings();
    const basePath = settings.downloadPath || "";

    if (!basePath) {
      showToast("Please set a download directory in Settings first", "error");
      return;
    }

    setIsStartingDirect(true);
    try {
      const title = directTitle.trim() || "Manual Download";
      const id = `direct-${Date.now()}`;
      
      addDownloadStore({
        id,
        url: directUrl,
        savePath: basePath,
        status: 'pending',
        progress: 0,
        metadata: { 
           title: title
        }
      });

      await window.electronAPI.startDownload(directUrl, basePath, { seriesTitle: title });
      
      // Save record to DB
      await window.electronAPI.saveRecord({
        url: directUrl,
        save_path: basePath,
        status: 'pending',
        progress: 0,
        title: title,
        source_id: 'direct'
      });

      showToast("Download started!", "success");
      setDirectUrl("");
      setDirectTitle("");
    } catch (error) {
      console.error("Direct download failed:", error);
      showToast("Failed to start download", "error");
    } finally {
      setIsStartingDirect(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-center mb-10">
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 shadow-inner">
          <button 
            onClick={() => setMode('search')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${mode === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Search Library
          </button>
          <button 
            onClick={() => setMode('direct')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${mode === 'direct' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Direct Link
          </button>
        </div>
      </div>

      {!selectedSeries ? (
        <>
          {mode === 'search' ? (
            <>
              <form onSubmit={handleSearch} className="relative mb-10 max-w-2xl mx-auto">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="main-search-input"
                  type="text"
                  placeholder="Search or browse trending content..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin w-5 h-5" />}
              </form>

              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 px-2">
                {searchQuery.trim() ? "Search Results" : "🔥 Trending & Recent"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {isSearching ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <PosterSkeleton key={i} />
                  ))
                ) : (
                  results.map((series) => (
                    <div 
                      key={`${series.sourceId}-${series.id}`} 
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                      onClick={() => setSelectedSeries(series)}
                    >
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-md border border-white/20">
                          via {getSourceName(series.sourceId)}
                        </span>
                      </div>
                      <div className="aspect-[2/3] overflow-hidden relative">
                        {series.thumbnail ? (
                          <img 
                            src={series.thumbnail} 
                            alt={series.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                             <Play className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{series.title}</h3>
                        <p className="text-sm text-amber-500 font-bold mt-1">★ {series.rating || 'N/A'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {results.length === 0 && !isSearching && searchQuery && (
                <div className="text-center py-20">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No results found across "The Big 10" sources.</p>
                </div>
              )}
            </>
          ) : (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Play className="w-6 h-6 text-blue-600 fill-blue-600" />
                Paste Direct Link
              </h2>
              <form onSubmit={handleDirectDownload} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Video Source URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 font-medium"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="My Awesome Video"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 font-medium"
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isStartingDirect || !directUrl}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isStartingDirect ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  Download Now
                </button>
              </form>
            </div>
          )}
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
            <div className="w-full md:w-1/3 max-w-sm mx-auto md:mx-0 relative">
               <div className="absolute top-4 left-4 z-10">
                  <span className="bg-blue-600 text-white text-xs uppercase tracking-widest font-black px-3 py-1.5 rounded-lg shadow-lg">
                    Source: {getSourceName(selectedSeries.sourceId)}
                  </span>
                </div>
              <img src={selectedSeries.thumbnail} className="w-full rounded-2xl shadow-2xl" alt="" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black text-gray-900 mb-2">{selectedSeries.title}</h1>
              <p className="text-xl text-amber-500 font-bold mb-6">★ {selectedSeries.rating || 'N/A'}</p>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-8">
                <h3 className="font-bold text-blue-900 mb-2">Description</h3>
                <p className="text-blue-800/80 leading-relaxed">{selectedSeries.description || "No description available for this archival item."}</p>
              </div>

              <div className="space-y-6">
                {selectedSeries.seasons.length > 0 ? selectedSeries.seasons.map((season: any) => (
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
                )) : (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                     <button 
                        onClick={async () => {
                           // Auto-fetch episodes if none found via IPC
                           try {
                              const links = await window.electronAPI.getSeasonLinks(selectedSeries.sourceId, selectedSeries.id);
                              if (links.length > 0) {
                                 const eps = await window.electronAPI.getEpisodes(selectedSeries.sourceId, selectedSeries.id, links[0].number);
                                 setSelectedSeries({
                                    ...selectedSeries, 
                                    seasons: [{number: links[0].number, episodes: eps}]
                                 });
                              }
                           } catch (err) {
                              console.error("Failed to fetch episodes via IPC:", err);
                           }
                        }}
                        className="text-blue-600 font-bold hover:underline"
                     >
                        Click to fetch archival items/episodes
                     </button>
                  </div>
                )}
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
