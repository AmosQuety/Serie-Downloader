export interface SeriesMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  rating?: string;
  seasons: SeasonMetadata[];
}

export interface SeasonMetadata {
  number: number;
  episodes: EpisodeMetadata[];
}

export interface EpisodeMetadata {
  id: string;
  title: string;
  season: number;
  number: number;
  downloadUrl: string;
  thumbnail?: string;
  description?: string;
  rating?: string;
  fileSize?: number;
}

export interface IContentSource {
  readonly name: string;
  search(query: string): Promise<SeriesMetadata[]>;
  getSeriesDetails(id: string): Promise<SeriesMetadata>;
  getDownloadUrl(episodeId: string): Promise<string>;
}
