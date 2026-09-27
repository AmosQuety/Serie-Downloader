import { ipcMain, dialog } from "electron";
import type { IpcContext } from "./context";

export function registerDialogHandlers({ getWindow }: IpcContext) {
  ipcMain.handle("show-save-dialog", async (_event, options: { defaultPath?: string } = {}) => {
    try {
      const result = await dialog.showSaveDialog(getWindow()!, {
        title: 'Save Downloaded File',
        defaultPath: options.defaultPath || 'downloaded_file',
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'] },
          { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a'] },
          { name: 'Archives', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] }
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      });

      return {
        canceled: result.canceled,
        filePath: result.filePath || null
      };
    } catch (error) {
      console.error("File dialog error:", error);
      return {
        canceled: true,
        filePath: null,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

  ipcMain.handle("select-directory", async () => {
    const win = getWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
}
