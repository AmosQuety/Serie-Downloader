import { describe, it, expect, vi } from "vitest";
import { SourceManager, VideoSource } from "./SourceManager";
import type { SeriesMetadata } from "../src/types/sources";

function makeSource(id: string, overrides: Partial<VideoSource> = {}): VideoSource {
  return {
    id,
    name: id,
    search: vi.fn(async () => []),
    getSeasonLinks: vi.fn(async () => []),
    getEpisodes: vi.fn(async () => []),
    getDownloadUrl: vi.fn(async () => ""),
    ...overrides,
  };
}

function series(id: string, sourceId: string): SeriesMetadata {
  return { id, title: id, description: "", seasons: [], sourceId };
}

describe("SourceManager", () => {
  it("registers sources passed into the constructor and retrieves them by id", () => {
    const source = makeSource("test-source");
    const manager = new SourceManager([source]);

    expect(manager.getSource("test-source")).toBe(source);
    expect(manager.getAllSources()).toEqual([source]);
  });

  it("returns undefined for an unknown source id", () => {
    const manager = new SourceManager([makeSource("a")]);

    expect(manager.getSource("missing")).toBeUndefined();
  });

  it("aggregates results from every source that succeeds", async () => {
    const resultsA = [series("1", "a")];
    const resultsB = [series("2", "b")];
    const sourceA = makeSource("a", { search: vi.fn(async () => resultsA) });
    const sourceB = makeSource("b", { search: vi.fn(async () => resultsB) });
    const manager = new SourceManager([sourceA, sourceB]);

    const outcomes = await manager.searchAll("query");

    expect(outcomes).toEqual([
      { sourceId: "a", results: resultsA },
      { sourceId: "b", results: resultsB },
    ]);
  });

  it("isolates a failing source so the others still return their results", async () => {
    const goodResults = [series("1", "good")];
    const goodSource = makeSource("good", { search: vi.fn(async () => goodResults) });
    const badSource = makeSource("bad", {
      search: vi.fn(async () => {
        throw new Error("scrape failed");
      }),
    });
    const manager = new SourceManager([badSource, goodSource]);

    const outcomes = await manager.searchAll("query");

    expect(outcomes).toEqual([
      { sourceId: "bad", results: [] },
      { sourceId: "good", results: goodResults },
    ]);
  });

  it("passes the query through to every registered source", async () => {
    const source = makeSource("a");
    const manager = new SourceManager([source]);

    await manager.searchAll("some query");

    expect(source.search).toHaveBeenCalledWith("some query");
  });
});
