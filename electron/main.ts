import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fetchProduct } from "./sourceFetchers";
import { resolveShortLink } from "./linkResolver";

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: "迈斯工具箱",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---- IPC ----
ipcMain.handle("app:ping", () => "pong");
ipcMain.handle("app:openExternal", (_e, url: string) => shell.openExternal(url));

ipcMain.handle("fetcher:resolveLink", async (_e, raw: string) => {
  try {
    return { ok: true, url: await resolveShortLink(raw) };
  } catch (e: any) {
    return { ok: false, error: e.message || String(e) };
  }
});

ipcMain.handle("fetcher:fetchProduct", async (_e, raw: string) => {
  try {
    const product = await fetchProduct(raw);
    return { ok: true, product };
  } catch (e: any) {
    return {
      ok: false,
      error: e.message || String(e),
      code: (e as any).code || "FETCH_ERROR"
    };
  }
});
