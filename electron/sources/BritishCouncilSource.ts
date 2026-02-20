import axios from 'axios';
import * as cheerio from 'cheerio';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class BritishCouncilSource implements VideoSource {
  readonly id = 'british-council';
  readonly name = 'British Council Film';
  private baseUrl = 'http://film.britishcouncil.org';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      const searchUrl = `${this.baseUrl}/british-council-film-collection/the-collection?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: SeriesMetadata[] = [];
      
      $('.film-item').each((_: number, element: any) => {
        const title = $(element).find('h3').text().trim();
        const link = $(element).find('a').attr('href');
        
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
      console.error('British Council search error:', error);
      return [];
    }
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: seriesId.startsWith('http') ? seriesId : `${this.baseUrl}${seriesId}` }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    try {
      const detailsUrl = seriesId.startsWith('http') ? seriesId : `${this.baseUrl}${seriesId}`;
      const response = await axios.get(detailsUrl);
      const $ = cheerio.load(response.data);
      
      // British Council usually embeds Vimeo
      const vimeoIframe = $('iframe[src*="vimeo"]').attr('src');
      
      if (vimeoIframe) {
        return [{
          id: vimeoIframe,
          title: 'Archive Film',
          season: seasonNumber,
          number: 1,
          downloadUrl: vimeoIframe,
          sourceId: this.id,
        }];
      }
      return [];
    } catch (error) {
      console.error('British Council detail error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return episodeId;
  }
}
