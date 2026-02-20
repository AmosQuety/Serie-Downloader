import axios from 'axios';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class LOCSource implements VideoSource {
  readonly id = 'loc-gov';
  readonly name = 'Library of Congress';
  private baseUrl = 'https://www.loc.gov';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      // Library of Congress JSON API
      // Searching specifically in the "moving-image" category with "free-to-use" filter if possible,
      // but loc.gov search is a bit broader.
      const searchUrl = `${this.baseUrl}/search/?q=${encodeURIComponent(query)}&fa=original-format:moving+image&fo=json&c=50`;
      const response = await axios.get(searchUrl);
      const data = response.data;
      
      const results: SeriesMetadata[] = [];
      const items = data.results || [];
      
      for (const item of items) {
        if (item.id && item.title) {
          results.push({
            id: item.id,
            title: item.title,
            description: item.description?.[0] || '',
            thumbnail: item.image_url?.[0] || undefined,
            seasons: [],
            sourceId: this.id,
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('LOC search error:', error);
      return [];
    }
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: seriesId.startsWith('http') ? seriesId : `${this.baseUrl}${seriesId}` }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    try {
      // LOC items often have multiple media formats. We need to find the MP4.
      const detailsUrl = `${seriesId.startsWith('http') ? seriesId : `${this.baseUrl}${seriesId}`}?fo=json`;
      const response = await axios.get(detailsUrl);
      const data = response.data;
      
      const episodes: EpisodeMetadata[] = [];
      const item = data.item || {};
      const resources = data.resources || [];
      
      let index = 1;
      for (const res of resources) {
        const files = res.files || [];
        for (const fileGroup of files) {
          // Look for MP4 or high quality video
          const videoFile = fileGroup.find((f: any) => f.url && (f.url.endsWith('.mp4') || f.url.endsWith('.mov') || f.mimetype?.includes('video/mp4')));
          
          if (videoFile) {
            episodes.push({
              id: videoFile.url,
              title: item.title || `Part ${index}`,
              season: seasonNumber,
              number: index++,
              downloadUrl: videoFile.url,
              sourceId: this.id,
            });
          }
        }
      }
      
      // Fallback: If no resources found but there's a direct link in the item metadata
      if (episodes.length === 0 && item.id) {
        // Sometimes LOC uses a specific player, we might need Playwright here later if complexity increases.
        // For now, let's assume direct links are preferred.
      }
      
      return episodes;
    } catch (error) {
      console.error('LOC getEpisodes error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return episodeId; // In LOC case, the ID we use is the direct URL found
  }
}
