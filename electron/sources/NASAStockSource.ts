import axios from 'axios';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class NASAStockSource implements VideoSource {
  readonly id = 'nasa-stock';
  readonly name = 'NASA / Public Stock';
  
  // NASA Image and Video Library API
  private apiUrl = 'https://images-api.nasa.gov';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      const searchUrl = `${this.apiUrl}/search?q=${encodeURIComponent(query)}&media_type=video`;
      const response = await axios.get(searchUrl);
      const items = response.data.collection.items || [];
      
      const results: SeriesMetadata[] = [];
      
      for (const item of items) {
        const data = item.data?.[0];
        const links = item.links?.[0];
        
        if (data && data.nasa_id) {
          results.push({
            id: data.nasa_id,
            title: data.title,
            description: data.description || '',
            thumbnail: links?.href,
            seasons: [],
            sourceId: this.id,
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('NASA search error:', error);
      return [];
    }
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: seriesId }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    try {
      // NASA API returns a collection JSON that lists assets (including mp4s)
      const assetUrl = `${this.apiUrl}/asset/${seriesId}`;
      const response = await axios.get(assetUrl);
      const items = response.data.collection.items || [];
      
      // Find the best quality MP4
      const videoAsset = items.find((item: any) => item.href.endsWith('~orig.mp4')) || 
                         items.find((item: any) => item.href.endsWith('.mp4'));
      
      if (videoAsset) {
        return [{
          id: seriesId,
          title: 'High Quality Stream',
          season: seasonNumber,
          number: 1,
          downloadUrl: videoAsset.href,
          sourceId: this.id,
        }];
      }
      return [];
    } catch (error) {
      console.error('NASA assets error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    // NASA DownloadUrl is resolved in getEpisodes
    return episodeId;
  }
}
