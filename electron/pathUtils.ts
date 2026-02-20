import path from 'path';
import fs from 'fs';
import sanitize from 'sanitize-filename';

export interface PathMetadata {
  seriesTitle: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
}

export function getOrganizedPath(basePath: string, meta: PathMetadata, extension: string = '.mp4'): string {
  // 1. Sanitize series title and create base folder
  const seriesFolder = sanitize(meta.seriesTitle);
  let finalDir = path.join(basePath, seriesFolder);

  // 2. Handle Season subfolder
  if (meta.season !== undefined) {
    const seasonFolder = `Season ${meta.season.toString().padStart(2, '0')}`;
    finalDir = path.join(finalDir, seasonFolder);
  }

  // 3. Create directories recursively
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }

  // 4. Sanitize and build filename
  // Format: S01E01 - Episode Title.mp4 or Episode Title.mp4
  let filename = "";
  if (meta.season !== undefined && meta.episode !== undefined) {
    filename += `S${meta.season.toString().padStart(2, '0')}E${meta.episode.toString().padStart(2, '0')}`;
    if (meta.episodeTitle) {
      filename += ` - ${sanitize(meta.episodeTitle)}`;
    }
  } else {
    filename = sanitize(meta.episodeTitle || "download");
  }

  return path.join(finalDir, `${filename}${extension}`);
}
