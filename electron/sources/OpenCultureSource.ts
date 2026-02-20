import axios from 'axios';
import * as cheerio from 'cheerio';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class OpenCultureSource implements VideoSource {
  readonly id = 'open-culture';
  readonly name = 'Open Culture';
  private baseUrl = 'https://www.openculture.com';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      // Open Culture doesn't have a great internal video search, it's mostly curated posts.
      // We search their "free movies online" directory.
      const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: SeriesMetadata[] = [];
      
      $('article').each((_: number, element: any) => {
        const title = $(element).find('h2 a').text().trim();
        const link = $(element).find('h2 a').attr('href');
        
        if (link && title) {
          results.push({
            id: link,
            title,
            description: $(element).find('.entry-content').text().substring(0, 150) + '...',
            seasons: [],
            sourceId: this.id,
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Open Culture search error:', error);
      return [];
    }
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: seriesId }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    try {
      const response = await axios.get(seriesId);
      const $ = cheerio.load(response.data);
      
      // Open Culture usually embeds YouTube or Vimeo.
      // We look for iframe src.
      const iframeSrc = $('iframe').attr('src');
      
      if (iframeSrc) {
        return [{
          id: iframeSrc,
          title: 'Embedded Video',
          season: seasonNumber,
          number: 1,
          downloadUrl: iframeSrc,
          sourceId: this.id,
        }];
      }
      return [];
    } catch (error) {
      console.error('Open Culture detail error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return episodeId;
  }
}
