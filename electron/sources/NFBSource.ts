import axios from 'axios';
import * as cheerio from 'cheerio';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class NFBSource implements VideoSource {
  readonly id = 'nfb-ca';
  readonly name = 'National Film Board';
  private baseUrl = 'https://www.nfb.ca';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      const searchUrl = `${this.baseUrl}/search/?q=${encodeURIComponent(query)}&type=film`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: SeriesMetadata[] = [];
      
      $('.film-card').each((_: number, element: any) => {
        const title = $(element).find('.film-card__title').text().trim();
        const link = $(element).find('a').attr('href');
        const thumbnail = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');
        
        if (link && title) {
          results.push({
            id: link,
            title,
            description: '',
            thumbnail: thumbnail ? (thumbnail.startsWith('http') ? thumbnail : `${this.baseUrl}${thumbnail}`) : undefined,
            seasons: [],
            sourceId: this.id,
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('NFB search error:', error);
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
      
      const episodes: EpisodeMetadata[] = [];
      // NFB uses a complex player, but we can look for manifest links or direct mp4 if available in meta tags
      const title = $('h1').text().trim();
      
      // Placeholder for resolving NFB stream - usually requires identifying the player ID
      episodes.push({
        id: seriesId,
        title: title || 'Full Film',
        season: seasonNumber,
        number: 1,
        downloadUrl: detailsUrl,
        sourceId: this.id,
      });
      
      return episodes;
    } catch (error) {
      console.error('NFB getEpisodes error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return episodeId.startsWith('http') ? episodeId : `${this.baseUrl}${episodeId}`;
  }
}
