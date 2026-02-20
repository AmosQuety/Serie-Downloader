import { SeriesMetadata, EpisodeMetadata } from '../src/types/sources';
import {
  ArchiveOrgSource,
  LOCSource,
  PublicDomainMovieSource,
  YouTubeSource,
  NFBSource,
  NASAStockSource,
  OpenCultureSource,
  BritishCouncilSource,
  VimeoCCSource,
  PrattArchiveSource
} from './sources';

export interface VideoSource {
  readonly id: string;
  readonly name: string;
  search(query: string): Promise<SeriesMetadata[]>;
  getSeasonLinks(seriesId: string): Promise<{ number: number; url: string }[]>;
  getEpisodes(seriesId: string, seasonNumber: number): Promise<EpisodeMetadata[]>;
  getDownloadUrl(episodeId: string): Promise<string>;
}

export class SourceManager {
  private sources: Map<string, VideoSource> = new Map();

  constructor() {
    // Register "The Big 10" sources
    this.registerSource(new ArchiveOrgSource());
    this.registerSource(new LOCSource());
    this.registerSource(new PublicDomainMovieSource());
    this.registerSource(new YouTubeSource());
    this.registerSource(new NFBSource());
    this.registerSource(new NASAStockSource());
    this.registerSource(new OpenCultureSource());
    this.registerSource(new BritishCouncilSource());
    this.registerSource(new VimeoCCSource());
    this.registerSource(new PrattArchiveSource());
  }

  registerSource(source: VideoSource) {
    this.sources.set(source.id, source);
  }

  getSource(id: string): VideoSource | undefined {
    return this.sources.get(id);
  }

  getAllSources(): VideoSource[] {
    return Array.from(this.sources.values());
  }

  async searchAll(query: string): Promise<{ sourceId: string; results: SeriesMetadata[] }[]> {
    const searchPromises = this.getAllSources().map(async (source) => {
      const results = await source.search(query);
      return {
        sourceId: source.id,
        results,
      };
    });

    const outcomes = await Promise.allSettled(searchPromises);
    
    return outcomes.map((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        return outcome.value;
      } else {
        const sourceId = this.getAllSources()[index].id;
        console.error(`Search failed for source ${sourceId}:`, outcome.reason);
        return {
          sourceId,
          results: [],
        };
      }
    });
  }
}

export const sourceManager = new SourceManager();
