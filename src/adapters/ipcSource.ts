import { SourceAdapter } from "./types";
import { ParsedLink, Product } from "../types/product";
import { uuid } from "../lib/uuid";

export const ipcSourceAdapter: SourceAdapter = {
  platform: "1688",
  async fetch(link: ParsedLink): Promise<Product> {
    if (!window.mais) throw new Error("IPC bridge unavailable (not in Electron)");
    const res = await window.mais.fetchProduct(link.rawUrl || link.normalizedUrl);
    if (!res.ok) {
      throw new Error(res.error);
    }
    const p = res.product;
    return {
      id: uuid(),
      source: link,
      title: p.title,
      price: p.price,
      description: p.description,
      mainImage: p.mainImage || undefined,
      images: p.images,
      skus: [],
      tags: [],
      createdAt: Date.now(),
      status: "fetched"
    };
  }
};
