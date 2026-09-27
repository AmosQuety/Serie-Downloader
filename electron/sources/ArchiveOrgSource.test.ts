import { describe, it, expect, vi } from "vitest";

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

import axios from "axios";
import { ArchiveOrgSource } from "./ArchiveOrgSource";

const mockedGet = vi.mocked(axios.get);

describe("ArchiveOrgSource", () => {
  describe("search", () => {
    it("parses title, identifier and an absolute thumbnail URL from the results page", async () => {
      mockedGet.mockResolvedValue({
        data: `
          <div class="item-ia" data-id="prelinger-1234">
            <div class="title">A Public Domain Film</div>
            <img class="item-img" src="/services/img/prelinger-1234" />
          </div>
        `,
      });

      const source = new ArchiveOrgSource();
      const results = await source.search("prelinger");

      expect(results).toEqual([
        {
          id: "prelinger-1234",
          title: "A Public Domain Film",
          description: "",
          thumbnail: "https://archive.org/services/img/prelinger-1234",
          seasons: [],
          sourceId: "archive-org",
        },
      ]);
    });

    it("keeps an already-absolute thumbnail URL unchanged", async () => {
      mockedGet.mockResolvedValue({
        data: `
          <div class="item-ia" data-id="abc">
            <div class="title">Something</div>
            <img src="https://cdn.example.com/thumb.jpg" />
          </div>
        `,
      });

      const results = await new ArchiveOrgSource().search("query");

      expect(results[0].thumbnail).toBe("https://cdn.example.com/thumb.jpg");
    });

    it("skips result items missing an identifier or a title", async () => {
      mockedGet.mockResolvedValue({
        data: `
          <div class="item-ia">
            <div class="title">No identifier here</div>
          </div>
          <div class="item-ia" data-id="has-id-only"></div>
        `,
      });

      const results = await new ArchiveOrgSource().search("query");

      expect(results).toEqual([]);
    });

    it("returns an empty array instead of throwing when the request fails", async () => {
      mockedGet.mockRejectedValue(new Error("network down"));

      const results = await new ArchiveOrgSource().search("query");

      expect(results).toEqual([]);
    });
  });

  describe("getEpisodes", () => {
    it("keeps only video files and numbers them in encounter order", async () => {
      mockedGet.mockResolvedValue({
        data: {
          files: {
            "movie.mp4": { format: "MPEG4", size: "1024" },
            "readme.txt": { format: "Text" },
            "movie.mkv": { format: "Matroska" },
          },
        },
      });

      const episodes = await new ArchiveOrgSource().getEpisodes("prelinger-1234", 1);

      expect(episodes).toEqual([
        {
          id: "prelinger-1234/movie.mp4",
          title: "movie.mp4",
          season: 1,
          number: 1,
          downloadUrl: "https://archive.org/download/prelinger-1234/movie.mp4",
          fileSize: 1024,
          sourceId: "archive-org",
        },
        {
          id: "prelinger-1234/movie.mkv",
          title: "movie.mkv",
          season: 1,
          number: 2,
          downloadUrl: "https://archive.org/download/prelinger-1234/movie.mkv",
          fileSize: undefined,
          sourceId: "archive-org",
        },
      ]);
    });

    it("returns an empty array when there are no files", async () => {
      mockedGet.mockResolvedValue({ data: {} });

      const episodes = await new ArchiveOrgSource().getEpisodes("empty-item", 1);

      expect(episodes).toEqual([]);
    });

    it("returns an empty array instead of throwing when the request fails", async () => {
      mockedGet.mockRejectedValue(new Error("network down"));

      const episodes = await new ArchiveOrgSource().getEpisodes("prelinger-1234", 1);

      expect(episodes).toEqual([]);
    });
  });

  describe("getDownloadUrl", () => {
    it("builds a direct download URL from the episode id", async () => {
      const url = await new ArchiveOrgSource().getDownloadUrl("prelinger-1234/movie.mp4");

      expect(url).toBe("https://archive.org/download/prelinger-1234/movie.mp4");
    });
  });
});
