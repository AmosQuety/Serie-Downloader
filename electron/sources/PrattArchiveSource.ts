import axios from 'axios';
import * as cheerio from 'cheerio';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class PrattArchiveSource implements VideoSource {
  readonly id = 'pratt-archive';
  readonly name = 'Enoch Pratt Archive';
  private baseUrl = 'https://digitalmaryland.org';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      // Searching Digital Maryland (Enoch Pratt's digital collections)
      const searchUrl = `${this.baseUrl}/search/collection/p16022coll61/searchterm/${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: SeriesMetadata[] = [];
      
      // Selectors based on Digital Maryland/CONTENTdm structure
      $('.item-container').each((_: number, element: any) => {
        const title = $(element).find('.title-link').text().trim();
        const link = $(element).find('.title-link').attr('href');
        
        if (link && title) {
          results.push({
            id: link,
            title,
            description: '',
            seasons: [],
            sourceId: this.id,
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Pratt Archive search error:', error);
      return [];
    }
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: seriesId }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    return [{
      id: seriesId,
      title: 'Archival Record',
      season: seasonNumber,
      number: 1,
      downloadUrl: seriesId,
      sourceId: this.id,
    }];
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return episodeId;
  }
}
