import { IContentSource, SeriesMetadata } from '../../types/sources';

/**
 * A sample implementation of a Public Domain Source.
 * This provides enriched mock data to showcase the Media Center UI.
 */
export class PublicDomainSource implements IContentSource {
  readonly name = "Public Domain Archive";

  async search(query: string): Promise<SeriesMetadata[]> {
    const results: SeriesMetadata[] = [
      {
        id: "pd-1",
        title: "The Great Space Journey",
        description: "An epic adventure through the cosmos, discovering new worlds and civilizations.",
        thumbnail: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80",
        rating: "8.9",
        seasons: [
          { number: 1, episodes: [] },
          { number: 2, episodes: [] }
        ]
      },
      {
        id: "pd-2",
        title: "Cyber Chronicles",
        description: "In a world of neon and silicon, one hacker stands against the mega-corps.",
        thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
        rating: "9.2",
        seasons: [
          { number: 1, episodes: [] }
        ]
      },
      {
        id: "pd-3",
        title: "Mystery Manor",
        description: "Dark secrets hidden in the shadows of an ancient Victorian estate.",
        thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
        rating: "7.5",
        seasons: [
          { number: 1, episodes: [] }
        ]
      }
    ];
    return results.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  }

  async getSeriesDetails(id: string): Promise<SeriesMetadata> {
    const seriesList = await this.search("");
    const series = seriesList.find(s => s.id === id);
    if (!series) throw new Error("Series not found");

    // Mock episode generation
    return {
      ...series,
      seasons: series.seasons.map(s => ({
        ...s,
        episodes: Array.from({ length: s.number === 1 ? 5 : 3 }, (_, i) => ({
          id: `${id}-s${s.number}-e${i + 1}`,
          title: `Episode ${i + 1}: The Discovery`,
          number: i + 1,
          season: s.number,
          downloadUrl: `https://archive.org/download/example_video_${i + 1}/file.mp4`,
          thumbnail: series.thumbnail,
          description: `This is a detailed description of episode ${i + 1} of season ${s.number}.`,
          rating: series.rating
        }))
      }))
    };
  }

  async getDownloadUrl(episodeId: string): Promise<string> {
    return `https://archive.org/download/example_video_${episodeId}/file.mp4`;
  }
}
