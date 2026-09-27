import { ipcMain } from "electron";
import { logError } from "../logger";
import { sourceManager } from "../SourceManager";

export function registerSourceHandlers() {
  ipcMain.handle("search-sources", async (_event, query: string) => {
    try {
      return await sourceManager.searchAll(query);
    } catch (error) {
      logError("IPC Search sources failed", error);
      return [];
    }
  });

  ipcMain.handle("get-season-links", async (_event, { sourceId, seriesId }: { sourceId: string; seriesId: string }) => {
    try {
      const source = sourceManager.getSource(sourceId);
      if (!source) throw new Error(`Source ${sourceId} not found`);
      return await source.getSeasonLinks(seriesId);
    } catch (error) {
      logError(`IPC get-season-links failed for ${sourceId}`, error);
      return [];
    }
  });

  ipcMain.handle("get-episodes", async (_event, { sourceId, seriesId, seasonNumber }: { sourceId: string; seriesId: string; seasonNumber: number }) => {
    try {
      const source = sourceManager.getSource(sourceId);
      if (!source) throw new Error(`Source ${sourceId} not found`);
      return await source.getEpisodes(seriesId, seasonNumber);
    } catch (error) {
      logError(`IPC get-episodes failed for ${sourceId}`, error);
      return [];
    }
  });

  ipcMain.handle("get-source-download-url", async (_event, { sourceId, episodeId }: { sourceId: string; episodeId: string }) => {
    try {
      const source = sourceManager.getSource(sourceId);
      if (!source) throw new Error(`Source ${sourceId} not found`);
      return await source.getDownloadUrl(episodeId);
    } catch (error) {
      logError(`IPC get-download-url failed for ${sourceId}`, error);
      throw error;
    }
  });
}
