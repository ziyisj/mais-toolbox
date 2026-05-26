import { contextBridge, ipcRenderer } from "electron";

export interface FetchedProductLike {
  platform: string;
  itemId: string;
  sourceUrl: string;
  title: string;
  price: number;
  description: string;
  mainImage: string | null;
  images: { url: string; alt?: string }[];
}

contextBridge.exposeInMainWorld("mais", {
  ping: () => ipcRenderer.invoke("app:ping"),
  openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url),
  resolveLink: (raw: string) =>
    ipcRenderer.invoke("fetcher:resolveLink", raw) as Promise<
      { ok: true; url: string } | { ok: false; error: string }
    >,
  fetchProduct: (raw: string) =>
    ipcRenderer.invoke("fetcher:fetchProduct", raw) as Promise<
      | { ok: true; product: FetchedProductLike }
      | { ok: false; error: string; code: string }
    >
});

declare global {
  interface Window {
    mais: {
      ping: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      resolveLink: (raw: string) => Promise<
        { ok: true; url: string } | { ok: false; error: string }
      >;
      fetchProduct: (raw: string) => Promise<
        | { ok: true; product: FetchedProductLike }
        | { ok: false; error: string; code: string }
      >;
    };
  }
}
