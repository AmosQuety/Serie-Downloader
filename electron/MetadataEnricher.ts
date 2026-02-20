import axios from 'axios';
import { logInfo, logError } from './logger';

export interface EnrichedMetadata {
  title: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  rating: string;
  genres: string[];
  releaseYear?: string;
}

class MetadataEnricher {
  private tmdbKey: string | undefined;
  private omdbKey: string | undefined;
  private queue: { title: string; type: 'movie' | 'tv'; callback: (data: EnrichedMetadata | null) => void }[] = [];
  private isProcessing = false;

  constructor(tmdbKey?: string, omdbKey?: string) {
    this.tmdbKey = tmdbKey;
    this.omdbKey = omdbKey;
  }

  public setKeys(tmdbKey?: string, omdbKey?: string) {
    this.tmdbKey = tmdbKey;
    this.omdbKey = omdbKey;
  }

  public async enrich(title: string, type: 'movie' | 'tv' = 'tv'): Promise<EnrichedMetadata | null> {
    return new Promise((resolve) => {
      this.queue.push({ 
        title, 
        type, 
        callback: (data) => resolve(data) 
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { title, type, callback } = this.queue.shift()!;

    try {
      logInfo(`Enriching metadata for: ${title} (${type})`);
      let result = await this.fetchFromTMDB(title, type);
      
      if (!result && this.omdbKey) {
        logInfo(`TMDB failed or no key, trying OMDB for: ${title}`);
        result = await this.fetchFromOMDB(title, type);
      }

      callback(result);
    } catch (error) {
      logError(`Metadata enrichment failed for ${title}`, error);
      callback(null);
    } finally {
      this.isProcessing = false;
      // Small delay to avoid hitting rate limits too fast
      setTimeout(() => this.processQueue(), 500);
    }
  }

  private async fetchFromTMDB(title: string, type: 'movie' | 'tv'): Promise<EnrichedMetadata | null> {
    if (!this.tmdbKey) return null;

    try {
      const searchRes = await axios.get(`https://api.themoviedb.org/3/search/${type}`, {
        params: {
          api_key: this.tmdbKey,
          query: title,
        }
      });

      const firstResult = searchRes.data.results?.[0];
      if (!firstResult) return null;

      const detailsRes = await axios.get(`https://api.themoviedb.org/3/${type}/${firstResult.id}`, {
        params: {
          api_key: this.tmdbKey,
        }
      });

      const data = detailsRes.data;
      return {
        title: data.name || data.title,
        description: data.overview,
        thumbnail: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
        backdrop: `https://image.tmdb.org/t/p/original${data.backdrop_path}`,
        rating: data.vote_average?.toString() || 'N/A',
        genres: data.genres?.map((g: any) => g.name) || [],
        releaseYear: (data.first_air_date || data.release_date || '').split('-')[0],
      };
    } catch (error) {
      logError('TMDB fetch error', error);
      return null;
    }
  }

  private async fetchFromOMDB(title: string, type: 'movie' | 'tv'): Promise<EnrichedMetadata | null> {
    if (!this.omdbKey) return null;

    try {
      const res = await axios.get('http://www.omdbapi.com/', {
        params: {
          apikey: this.omdbKey,
          t: title,
          type: type === 'tv' ? 'series' : 'movie',
        }
      });

      const data = res.data;
      if (data.Response === 'False') return null;

      return {
        title: data.Title,
        description: data.Plot,
        thumbnail: data.Poster !== 'N/A' ? data.Poster : '',
        backdrop: '', // OMDB doesn't provide backdrops easily
        rating: data.imdbRating || 'N/A',
        genres: data.Genre?.split(', ') || [],
        releaseYear: data.Year?.split('–')[0],
      };
    } catch (error) {
      logError('OMDB fetch error', error);
      return null;
    }
  }
}

export const metadataEnricher = new MetadataEnricher();
