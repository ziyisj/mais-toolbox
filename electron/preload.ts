import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mais", {
  ping: () => ipcRenderer.invoke("app:ping"),
  openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url)
});

declare global {
  interface Window {
    mais: {
      ping: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}
