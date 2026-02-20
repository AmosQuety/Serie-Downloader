import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logInfo, logError } from './logger';

export interface PlayerInfo {
  name: string;
  path: string;
  type: 'vlc' | 'mpv';
}

class PlayerManager {
  private players: PlayerInfo[] = [];

  constructor() {
    this.detectPlayers();
  }

  private detectPlayers() {
    const commonPaths = [
      // VLC
      { name: 'VLC', type: 'vlc' as const, path: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe' },
      { name: 'VLC', type: 'vlc' as const, path: 'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe' },
      // MPV
      { name: 'MPV', type: 'mpv' as const, path: 'C:\\Program Files\\mpv\\mpv.exe' },
      { name: 'MPV', type: 'mpv' as const, path: path.join(process.env.LOCALAPPDATA || '', 'mpv\\mpv.exe') },
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p.path)) {
        this.players.push(p);
        logInfo(`Detected player: ${p.name} at ${p.path}`);
      }
    }
  }

  public getAvailablePlayers(): PlayerInfo[] {
    return this.players;
  }

  /**
   * Sanitizes the path to prevent command injection.
   * Node process.spawn handles arguments as an array, which is already safer than exec.
   * We still normalize and check existence.
   */
  private sanitizePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    if (!fs.existsSync(normalized)) {
      throw new Error(`File does not exist: ${normalized}`);
    }
    return normalized;
  }

  public async playFile(filePath: string, startTime: number = 0): Promise<void> {
    const player = this.players[0]; // Default to first detected
    if (!player) {
      // Fallback to default OS association if no specific player is found
      logInfo('No specific player detected, falling back to OS default.');
      spawn('cmd', ['/c', 'start', '""', filePath], { shell: true });
      return;
    }

    const sanitizedPath = this.sanitizePath(filePath);
    const args: string[] = [sanitizedPath];

    if (startTime > 0) {
      if (player.type === 'vlc') {
        args.push(`--start-time=${startTime}`);
      } else if (player.type === 'mpv') {
        args.push(`--start=${startTime}`);
      }
    }

    logInfo(`Launching ${player.name} for ${sanitizedPath} at ${startTime}s`);

    return new Promise((resolve, reject) => {
      const child = spawn(player.path, args, {
        detached: true,
        stdio: 'ignore'
      });

      child.on('error', (err) => {
        logError(`Failed to start player: ${err.message}`);
        reject(err);
      });

      child.on('exit', (code) => {
        logInfo(`Player exited with code ${code}`);
        resolve();
      });

      // Unref allows the parent to exit independently if needed, 
      // but here we wait for 'exit' to save progress.
      // child.unref(); 
    });
  }
}

export const playerManager = new PlayerManager();
