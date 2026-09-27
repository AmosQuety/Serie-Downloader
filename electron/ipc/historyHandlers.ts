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
          enriched.description || series.description || null,
          enriched.thumbnail || series.thumbnail || null,
          enriched.backdrop,
          JSON.stringify(enriched.genres),
          enriched.rating || series.rating || null,
          series.id
        );
        logInfo(`Enriched database entry for series: ${series.title}`);
      }
    });

    // Upsert rather than INSERT OR REPLACE: a plain REPLACE deletes and
    // re-inserts the row, silently wiping backdrop/genres set by a previous
    // background enrichment since those columns aren't in this statement.
    const insertSeries = db.prepare(`
      INSERT INTO series (id, title, description, thumbnail, rating, source_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        thumbnail = COALESCE(excluded.thumbnail, series.thumbnail),
        rating = COALESCE(excluded.rating, series.rating),
        source_id = excluded.source_id
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
        seriesData.thumbnail ?? null,
        seriesData.rating ?? null,
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
            enriched.description || description || null,
            enriched.thumbnail || thumbnail || null,
            enriched.rating || rating || null,
            url
          );
        }
      });

      // Upsert rather than INSERT OR REPLACE: this handler is called both to
      // create a record and (via App.tsx's onDownloadComplete) to update one
      // that already exists. A plain REPLACE deletes and re-inserts the row,
      // silently nulling out any column not listed here - e.g. backdrop and
      // genres set by a previous background enrichment, or source_id when a
      // later call omits it. COALESCE keeps the existing value when the new
      // one isn't provided.
      const stmt = db.prepare(`
        INSERT INTO download_history (url, save_path, status, progress, title, season, episode, thumbnail, description, rating, source_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(url) DO UPDATE SET
          save_path = excluded.save_path,
          status = excluded.status,
          progress = excluded.progress,
          title = COALESCE(excluded.title, download_history.title),
          season = COALESCE(excluded.season, download_history.season),
          episode = COALESCE(excluded.episode, download_history.episode),
          thumbnail = COALESCE(excluded.thumbnail, download_history.thumbnail),
          description = COALESCE(excluded.description, download_history.description),
          rating = COALESCE(excluded.rating, download_history.rating),
          source_id = COALESCE(excluded.source_id, download_history.source_id)
      `);
      stmt.run(
        url,
        save_path,
        status,
        progress,
        title ?? null,
        season ?? null,
        episode ?? null,
        thumbnail ?? null,
        description ?? null,
        rating ?? null,
        source_id ?? null
      );
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
