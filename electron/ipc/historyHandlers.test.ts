import { describe, it, expect, vi, beforeEach } from "vitest";
import Database from "better-sqlite3";

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn(() => "/tmp") },
}));

vi.mock("../MetadataEnricher", () => ({
  metadataEnricher: {
    setKeys: vi.fn(),
    enrich: vi.fn(async () => null),
  },
}));

import { ipcMain } from "electron";
import { registerHistoryHandlers } from "./historyHandlers";
import type { IpcContext } from "./context";

function getHandler(channel: string) {
  const call = vi.mocked(ipcMain.handle).mock.calls.find(([name]) => name === channel);
  if (!call) throw new Error(`No handler registered for "${channel}"`);
  return call[1] as (event: unknown, payload: never) => unknown;
}

function createTestDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE download_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE,
      save_path TEXT,
      status TEXT,
      progress INTEGER,
      title TEXT,
      season INTEGER,
      episode INTEGER,
      thumbnail TEXT,
      backdrop TEXT,
      genres TEXT,
      description TEXT,
      rating TEXT,
      source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE series (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      thumbnail TEXT,
      backdrop TEXT,
      genres TEXT,
      rating TEXT,
      source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE episodes (
      id TEXT PRIMARY KEY,
      series_id TEXT,
      title TEXT,
      season INTEGER,
      number INTEGER,
      download_url TEXT,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      save_path TEXT,
      source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(series_id) REFERENCES series(id)
    );
  `);
  return db;
}

describe("registerHistoryHandlers", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    vi.mocked(ipcMain.handle).mockClear();
    db = createTestDb();
    const ctx: IpcContext = {
      getWindow: () => null,
      db,
      store: { get: vi.fn(), set: vi.fn() } as unknown as IpcContext["store"],
      downloadManager: {} as IpcContext["downloadManager"],
    };
    registerHistoryHandlers(ctx);
  });

  it("saves a new download record with all fields present", async () => {
    const saveDownloadRecord = getHandler("save-download-record");

    const result = await saveDownloadRecord(null, {
      url: "https://example.com/a.mp4",
      save_path: "/downloads/a.mp4",
      status: "completed",
      progress: 100,
      title: "Show",
      season: 1,
      episode: 2,
      thumbnail: "thumb.jpg",
      description: "desc",
      rating: "8.5",
      source_id: "archive-org",
    } as never);

    expect(result).toEqual({ success: true });
    const row = db.prepare("SELECT * FROM download_history WHERE url = ?").get("https://example.com/a.mp4");
    expect(row).toMatchObject({ source_id: "archive-org", title: "Show", thumbnail: "thumb.jpg" });
  });

  it("does not throw when optional fields are undefined", async () => {
    const saveDownloadRecord = getHandler("save-download-record");

    const result = await saveDownloadRecord(null, {
      url: "https://example.com/direct.mp4",
      save_path: "/downloads/direct.mp4",
      status: "pending",
      progress: 0,
      title: "Manual Download",
      source_id: "direct",
    } as never);

    expect(result).toEqual({ success: true });
  });

  it("preserves source_id and thumbnail on a completion re-save that omits them", async () => {
    const saveDownloadRecord = getHandler("save-download-record");
    const url = "https://example.com/direct.mp4";

    // First write: initial "pending" record with a source_id and no thumbnail yet.
    await saveDownloadRecord(null, {
      url,
      save_path: "/downloads/direct.mp4",
      status: "pending",
      progress: 0,
      title: "Manual Download",
      source_id: "direct",
    } as never);

    // Simulate a prior background enrichment having set a thumbnail.
    db.prepare("UPDATE download_history SET thumbnail = ? WHERE url = ?").run("enriched-thumb.jpg", url);

    // Second write: App.tsx's onDownloadComplete re-save, which never includes source_id.
    const result = await saveDownloadRecord(null, {
      url,
      save_path: "/downloads/direct.mp4",
      status: "completed",
      progress: 100,
      title: "Manual Download",
    } as never);

    expect(result).toEqual({ success: true });
    const row = db.prepare("SELECT * FROM download_history WHERE url = ?").get(url) as Record<string, unknown>;
    expect(row.status).toBe("completed");
    expect(row.source_id).toBe("direct");
    expect(row.thumbnail).toBe("enriched-thumb.jpg");
  });

  it("bulk-inserts a series and its episodes without throwing when thumbnail/rating are missing", async () => {
    const bulkInsertEpisodes = getHandler("bulk-insert-episodes");

    const result = await bulkInsertEpisodes(null, {
      series: {
        id: "series-1",
        title: "A Series",
        description: "desc",
        seasons: [],
        sourceId: "archive-org",
      },
      episodes: [
        { id: "ep-1", title: "Ep 1", season: 1, number: 1, downloadUrl: "https://x/1.mp4", sourceId: "archive-org" },
      ],
      sourceId: "archive-org",
    } as never);

    expect(result).toEqual({ success: true });
    const series = db.prepare("SELECT * FROM series WHERE id = ?").get("series-1");
    expect(series).toMatchObject({ title: "A Series" });
  });

  it("preserves an existing series' thumbnail when a later bulk-insert omits it", async () => {
    const bulkInsertEpisodes = getHandler("bulk-insert-episodes");

    await bulkInsertEpisodes(null, {
      series: { id: "series-2", title: "S", description: "d", thumbnail: "poster.jpg", seasons: [], sourceId: "a" },
      episodes: [],
      sourceId: "a",
    } as never);

    await bulkInsertEpisodes(null, {
      series: { id: "series-2", title: "S", description: "d", seasons: [], sourceId: "a" },
      episodes: [],
      sourceId: "a",
    } as never);

    const row = db.prepare("SELECT * FROM series WHERE id = ?").get("series-2") as Record<string, unknown>;
    expect(row.thumbnail).toBe("poster.jpg");
  });
});
