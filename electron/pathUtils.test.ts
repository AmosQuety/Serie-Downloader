import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { getOrganizedPath, PathMetadata } from "./pathUtils";

describe("getOrganizedPath", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sd-pathutils-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("builds a Season/Episode path with the episode title", () => {
    const meta: PathMetadata = {
      seriesTitle: "My Show",
      season: 1,
      episode: 3,
      episodeTitle: "The Beginning",
    };

    const result = getOrganizedPath(tmpDir, meta);

    expect(result).toBe(
      path.join(tmpDir, "My Show", "Season 01", "My Show S01E03 - The Beginning.mp4")
    );
  });

  it("pads season and episode numbers to two digits", () => {
    const result = getOrganizedPath(tmpDir, { seriesTitle: "Show", season: 9, episode: 9 });

    expect(result).toContain("Season 09");
    expect(result).toContain("S09E09");
  });

  it("omits the episode title suffix when none is given", () => {
    const result = getOrganizedPath(tmpDir, { seriesTitle: "Show", season: 1, episode: 1 });

    expect(path.basename(result)).toBe("Show S01E01.mp4");
  });

  it("falls back to a flat '<Series> - <Title>' filename for a movie with no season/episode", () => {
    const result = getOrganizedPath(tmpDir, { seriesTitle: "A Movie", episodeTitle: "Director's Cut" });

    expect(result).toBe(path.join(tmpDir, "A Movie", "A Movie - Director's Cut.mp4"));
  });

  it("falls back to 'Full' when a movie has no episode title either", () => {
    const result = getOrganizedPath(tmpDir, { seriesTitle: "A Movie" });

    expect(path.basename(result)).toBe("A Movie - Full.mp4");
  });

  it("sanitizes illegal filesystem characters in the series and episode titles", () => {
    const result = getOrganizedPath(tmpDir, {
      seriesTitle: "Show: Part 2/3",
      season: 1,
      episode: 1,
      episodeTitle: "What? / Really?",
    });

    // Only the path *within* tmpDir should be checked - tmpDir itself is a
    // real absolute path and legitimately contains slashes.
    const relative = path.relative(tmpDir, result);
    const segments = relative.split(path.sep);

    for (const segment of segments) {
      expect(segment).not.toMatch(/[:?/]/);
    }
  });

  it("respects a custom file extension", () => {
    const result = getOrganizedPath(tmpDir, { seriesTitle: "Show", season: 1, episode: 1 }, ".mkv");

    expect(result.endsWith(".mkv")).toBe(true);
  });

  it("creates the destination directory on disk", () => {
    getOrganizedPath(tmpDir, { seriesTitle: "Show", season: 2, episode: 5 });

    expect(fs.existsSync(path.join(tmpDir, "Show", "Season 02"))).toBe(true);
  });
});
