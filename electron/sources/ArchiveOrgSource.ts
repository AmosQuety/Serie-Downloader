import axios from 'axios';
import * as cheerio from 'cheerio';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class ArchiveOrgSource implements VideoSource {
  readonly id = 'archive-org';
  readonly name = 'Archive.org';
  private baseUrl = 'https://archive.org';

  async search(query: string): Promise<SeriesMetadata[]> {
    try {
      // Searching for movies/series in Archive.org
      // Refined to target Moving Image Archive and Prelinger
      const searchUrl = `${this.baseUrl}/search.php?query=${encodeURIComponent(query)}&and[]=mediatype%3A"movies"&and[]=collection%3A"prelinger" OR and[]=collection%3A"movies"`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: SeriesMetadata[] = [];
      
      $('.item-ia').each((_: number, element: any) => {
        const title = $(element).find('.title').text().trim();
        const identifier = $(element).attr('data-id');
        const thumbnail = $(element).find('.item-img').attr('src') || $(element).find('img').attr('src');
        
        if (identifier && title) {
          results.push({
            id: identifier,
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
      console.error('Archive.org search error:', error);
      return [];
    }
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: `${this.baseUrl}/details/${seriesId}` }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    try {
      const detailsUrl = `${this.baseUrl}/details/${seriesId}&output=json`;
      const response = await axios.get(detailsUrl);
      const data = response.data;
      
      const episodes: EpisodeMetadata[] = [];
      const files = data.files || {};
      
      let index = 1;
      for (const fileName in files) {
        const file = files[fileName];
        if (file.format && (file.format.includes('Video') || file.format.includes('MPEG4') || fileName.endsWith('.mp4') || fileName.endsWith('.mkv'))) {
          episodes.push({
            id: `${seriesId}/${fileName}`,
            title: fileName,
            season: seasonNumber,
            number: index++,
            downloadUrl: `${this.baseUrl}/download/${seriesId}/${fileName}`,
            fileSize: file.size ? parseInt(file.size) : undefined,
            sourceId: this.id,
          });
        }
      }
      
      return episodes;
    } catch (error) {
      console.error('Archive.org getEpisodes error:', error);
      return [];
    }
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return `${this.baseUrl}/download/${episodeId}`;
  }
}
