import axios from 'axios';
import * as cheerio from 'cheerio';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class PublicDomainMovieSource implements VideoSource {
  readonly id = 'pd-movie';
  readonly name = 'Public Domain Movie';
  private baseUrl = 'https://publicdomainmovie.net';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      const searchUrl = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: SeriesMetadata[] = [];
      
      $('.movie-card').each((_: number, element: any) => {
        const title = $(element).find('.movie-title').text().trim();
        const link = $(element).find('a').attr('href');
        const thumbnail = $(element).find('img').attr('src');
        
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
      console.error('PD Movie search error:', error);
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
      const downloadLink = $('.download-button').attr('href'); // This is a placeholder for actual logic
      
      if (downloadLink) {
        episodes.push({
          id: downloadLink,
          title: $('h1.title').text().trim() || 'Full Movie',
          season: seasonNumber,
          number: 1,
          downloadUrl: downloadLink.startsWith('http') ? downloadLink : `${this.baseUrl}${downloadLink}`,
          sourceId: this.id,
        });
      }
      
      return episodes;
    } catch (error) {
      console.error('PD Movie getEpisodes error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return episodeId;
  }
}
