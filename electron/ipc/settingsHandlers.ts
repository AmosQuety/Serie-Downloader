import { ipcMain } from "electron";
import type { IpcContext } from "./context";
import type { AppSettings } from "../../src/types";

export function registerSettingsHandlers({ store }: IpcContext) {
  ipcMain.handle("get-settings", () => {
    return store.store;
  });

  ipcMain.handle("set-setting", (_event, { key, value }: { key: keyof AppSettings; value: string | number }) => {
    store.set(key, value);
  });
}
