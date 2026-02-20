import path from 'path';
import fs from 'fs-extra';
import sanitize from 'sanitize-filename';

export interface PathMetadata {
  seriesTitle: string;
  title?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
}

/**
 * Generates an organized path based on strict rules:
 * {basePath}/{SeriesName}/Season {XX}/{SeriesName} S{XX}E{YY} - {EpisodeTitle}.mp4
 */
export function getOrganizedPath(basePath: string, meta: PathMetadata, extension: string = '.mp4'): string {
  // 1. Sanitize series title
  const cleanSeries = sanitize(meta.seriesTitle);
  let finalDir = path.join(basePath, cleanSeries);

  // 2. Handle Season subfolder (Strict: Season 01, Season 02...)
  if (meta.season !== undefined) {
    const seasonFolder = `Season ${meta.season.toString().padStart(2, '0')}`;
    finalDir = path.join(finalDir, seasonFolder);
  }

  // 3. Ensure full path exists
  fs.ensureDirSync(finalDir);

  // 4. Build strict filename
  // Format: {SeriesName} S{XX}E{YY} - {Title}.mp4
  let filename = cleanSeries;

  if (meta.season !== undefined && meta.episode !== undefined) {
    filename += ` S${meta.season.toString().padStart(2, '0')}E${meta.episode.toString().padStart(2, '0')}`;
    if (meta.episodeTitle) {
      filename += ` - ${sanitize(meta.episodeTitle)}`;
    }
  } else {
    // Fallback for single movies or unstructured items
    filename += ` - ${sanitize(meta.episodeTitle || "Full")}`;
  }

  return path.join(finalDir, `${filename}${extension}`);
}
