import type { IpcContext } from "./context";
import { registerDialogHandlers } from "./dialogHandlers";
import { registerDownloadHandlers } from "./downloadHandlers";
import { registerSettingsHandlers } from "./settingsHandlers";
import { registerHistoryHandlers } from "./historyHandlers";
import { registerPlaybackHandlers } from "./playbackHandlers";
import { registerSourceHandlers } from "./sourceHandlers";

export type { IpcContext };

export function registerAllIpcHandlers(ctx: IpcContext) {
  registerDialogHandlers(ctx);
  registerDownloadHandlers(ctx);
  registerSettingsHandlers(ctx);
  registerHistoryHandlers(ctx);
  registerPlaybackHandlers(ctx);
  registerSourceHandlers();
}
