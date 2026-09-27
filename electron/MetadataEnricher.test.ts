import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("electron", () => ({
  app: { getPath: vi.fn(() => "/tmp") },
}));

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

import axios from "axios";
import { MetadataEnricher } from "./MetadataEnricher";

const mockedGet = vi.mocked(axios.get);

describe("MetadataEnricher", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("resolves to null when no API keys are configured", async () => {
    const enricher = new MetadataEnricher();

    const result = await enricher.enrich("Anything");

    expect(result).toBeNull();
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("enriches from TMDB when a tmdbKey is set", async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url.includes("/search/")) {
        return { data: { results: [{ id: 42 }] } };
      }
      if (url.includes("/42")) {
        return {
          data: {
            name: "Test Show",
            overview: "A show",
            poster_path: "/poster.jpg",
            backdrop_path: "/backdrop.jpg",
            vote_average: 8.2,
            genres: [{ name: "Drama" }, { name: "Comedy" }],
            first_air_date: "2020-05-01",
          },
        };
      }
      throw new Error(`unexpected url: ${url}`);
    });

    const enricher = new MetadataEnricher("tmdb-key");
    const result = await enricher.enrich("Test Show", "tv");

    expect(result).toEqual({
      title: "Test Show",
      description: "A show",
      thumbnail: "https://image.tmdb.org/t/p/w500/poster.jpg",
      backdrop: "https://image.tmdb.org/t/p/original/backdrop.jpg",
      rating: "8.2",
      genres: ["Drama", "Comedy"],
      releaseYear: "2020",
    });
  });

  it("falls back to OMDB when TMDB has no results and an omdbKey is set", async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url.includes("themoviedb")) {
        return { data: { results: [] } };
      }
      if (url.includes("omdbapi")) {
        return {
          data: {
            Response: "True",
            Title: "OMDB Show",
            Plot: "An OMDB plot",
            Poster: "http://poster.example/x.jpg",
            imdbRating: "7.5",
            Genre: "Action, Adventure",
            Year: "2019",
          },
        };
      }
      throw new Error(`unexpected url: ${url}`);
    });

    const enricher = new MetadataEnricher("tmdb-key", "omdb-key");
    const result = await enricher.enrich("OMDB Show");

    expect(result).toMatchObject({
      title: "OMDB Show",
      rating: "7.5",
      genres: ["Action", "Adventure"],
    });
  });

  it("does not fall back to OMDB when no omdbKey is configured", async () => {
    mockedGet.mockResolvedValue({ data: { results: [] } });

    const enricher = new MetadataEnricher("tmdb-key");
    const result = await enricher.enrich("No Results");

    expect(result).toBeNull();
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it("treats OMDB's Response: 'False' as no match", async () => {
    mockedGet.mockResolvedValue({ data: { Response: "False" } });

    const enricher = new MetadataEnricher(undefined, "omdb-key");
    const result = await enricher.enrich("Unknown Movie", "movie");

    expect(result).toBeNull();
  });

  it("resolves to null instead of throwing when the request fails", async () => {
    mockedGet.mockRejectedValue(new Error("network down"));

    const enricher = new MetadataEnricher("tmdb-key");
    const result = await enricher.enrich("Anything");

    expect(result).toBeNull();
  });

  it("processes multiple queued enrich() calls without dropping any", async () => {
    vi.useFakeTimers();
    try {
      mockedGet.mockImplementation(async (url: string) => {
        if (url.includes("/search/")) return { data: { results: [{ id: 1 }] } };
        return { data: { name: "X", overview: "", poster_path: "", backdrop_path: "", genres: [] } };
      });

      const enricher = new MetadataEnricher("tmdb-key");
      const first = enricher.enrich("A");
      const second = enricher.enrich("B");

      await vi.runAllTimersAsync();

      const [firstResult, secondResult] = await Promise.all([first, second]);
      expect(firstResult).not.toBeNull();
      expect(secondResult).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
