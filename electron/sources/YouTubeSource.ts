import { chromium } from 'playwright';
import { VideoSource } from '../SourceManager';
import { SeriesMetadata, EpisodeMetadata } from '../../src/types/sources';

export class YouTubeSource implements VideoSource {
  readonly id = 'youtube-pd';
  readonly name = 'YouTube (Public Domain)';
  
  // Specific channels known for public domain or free-to-use content
  private targetChannels = [
    { name: 'FilmRise', url: 'https://www.youtube.com/@FilmRise/search?query=' },
    { name: 'Maverick Movies', url: 'https://www.youtube.com/@MaverickMovies/search?query=' },
    { name: 'Public Domain Movies', url: 'https://www.youtube.com/@PublicDomainMovies/search?query=' }
  ];

  async search(query: string): Promise<SeriesMetadata[]> {
    const browser = await chromium.launch({ headless: true });
    const results: SeriesMetadata[] = [];

    try {
      const page = await browser.newPage();
      
      for (const channel of this.targetChannels) {
        await page.goto(`${channel.url}${encodeURIComponent(query)}`);
        
        // Wait for video results to load
        await page.waitForSelector('ytd-video-renderer', { timeout: 10000 }).catch(() => {});
        
        const videos = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('ytd-video-renderer'));
          return items.map(item => {
            const titleEl = item.querySelector('#video-title');
            const thumbEl = item.querySelector('img');
            const linkEl = item.querySelector('a#video-title');
            
            return {
              id: linkEl?.getAttribute('href') || '',
              title: titleEl?.textContent?.trim() || '',
              thumbnail: thumbEl?.getAttribute('src') || '',
              description: item.querySelector('#description-text')?.textContent?.trim() || ''
            };
          });
        });

        for (const video of videos) {
          if (video.id && video.title) {
            results.push({
              id: video.id,
              title: `[${channel.name}] ${video.title}`,
              description: video.description,
              thumbnail: video.thumbnail,
              seasons: [],
              sourceId: this.id,
            });
          }
        }
      }
    } catch (error) {
      console.error('YouTube search error:', error);
    } finally {
      await browser.close();
    }
    
    return results;
  }

  async getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]> {
    return [{ number: 1, url: `https://www.youtube.com${seriesId}` }];
  }

  async getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]> {
    // For YouTube videos, we treat the video itself as the "episode"
    return [{
      id: seriesId,
      title: 'Full Video',
      season: seasonNumber,
      number: 1,
      downloadUrl: `https://www.youtube.com${seriesId}`,
      sourceId: this.id,
    }];
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    // Note: DownloadManager will need to handle YouTube URLs (e.g., using ytdl-core or similar)
    // For now, we return the YouTube watch URL.
    return `https://www.youtube.com${episodeId}`;
  }
}
