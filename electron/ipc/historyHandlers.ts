import { ipcMain } from "electron";
import { logInfo, logError } from "../logger";
import { metadataEnricher } from "../MetadataEnricher";
import type { IpcContext } from "./context";
import type { SeriesMetadata, EpisodeMetadata } from "../../src/types/sources";
import type { DownloadRecord } from "../../src/types";

export function registerHistoryHandlers({ db, store }: IpcContext) {
  ipcMain.handle("get-download-history", () => {
    try {
      const stmt = db.prepare("SELECT * FROM download_history ORDER BY created_at DESC");
      return stmt.all();
    } catch (error) {
      console.error("Failed to get history:", error);
      return [];
    }
  });

  // Bulk Insertion for Atomic Queue
  ipcMain.handle("bulk-insert-episodes", async (_event, { series, episodes, sourceId }: { series: SeriesMetadata; episodes: EpisodeMetadata[]; sourceId: string }) => {
    // 1. Enrich series metadata first (background, non-blocking for response)
    const storedTmdbKey = store.get("tmdbApiKey") as string;
    const storedOmdbKey = store.get("omdbApiKey") as string;

    metadataEnricher.setKeys(storedTmdbKey || process.env.TMDB_API_KEY, storedOmdbKey || process.env.OMDB_API_KEY);

    // Background enrichment
    metadataEnricher.enrich(series.title).then(enriched => {
      if (enriched) {
        db.prepare(`
          UPDATE series
          SET description = ?, thumbnail = ?, backdrop = ?, genres = ?, rating = ?
          WHERE id = ?
        `).run(
          enriched.description || series.description,
          enriched.thumbnail || series.thumbnail,
          enriched.backdrop,
          JSON.stringify(enriched.genres),
          enriched.rating || series.rating,
          series.id
        );
        logInfo(`Enriched database entry for series: ${series.title}`);
      }
    });

    const insertSeries = db.prepare(`
      INSERT OR REPLACE INTO series (id, title, description, thumbnail, rating, source_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertEpisode = db.prepare(`
      INSERT OR REPLACE INTO episodes (id, series_id, title, season, number, download_url, source_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const transaction = db.transaction((seriesData: SeriesMetadata, episodesData: EpisodeMetadata[]) => {
      insertSeries.run(
        seriesData.id,
        seriesData.title,
        seriesData.description,
        seriesData.thumbnail,
        seriesData.rating,
        sourceId
      );

      for (const ep of episodesData) {
        insertEpisode.run(
          ep.id,
          seriesData.id,
          ep.title,
          ep.season,
          ep.number,
          ep.downloadUrl,
          sourceId
        );
      }
    });

    try {
      transaction(series, episodes);
      return { success: true };
    } catch (error) {
      logError("Failed to bulk insert episodes", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("save-download-record", async (_event, record: DownloadRecord) => {
    try {
      const { url, save_path, status, progress, title, season, episode, thumbnail, description, rating, source_id } = record;

      // Start background enrichment for history
      metadataEnricher.enrich(title || "").then(enriched => {
        if (enriched) {
          db.prepare(`
            UPDATE download_history
            SET backdrop = ?, genres = ?, description = ?, thumbnail = ?, rating = ?
            WHERE url = ?
          `).run(
            enriched.backdrop,
            JSON.stringify(enriched.genres),
            enriched.description || description,
            enriched.thumbnail || thumbnail,
            enriched.rating || rating,
            url
          );
        }
      });

      const stmt = db.prepare(
        "INSERT OR REPLACE INTO download_history (url, save_path, status, progress, title, season, episode, thumbnail, description, rating, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run(url, save_path, status, progress, title, season, episode, thumbnail, description, rating, source_id);
      return { success: true };
    } catch (error) {
      logError("Failed to save download record", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}
