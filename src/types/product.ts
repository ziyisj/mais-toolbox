export type Platform = "taobao" | "pdd" | "douyin" | "1688" | "jd" | "unknown";

export interface ParsedLink {
  platform: Platform;
  itemId: string;
  rawUrl: string;
  normalizedUrl: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductSku {
  name: string;
  price: number;
  stock: number;
  attrs: Record<string, string>;
}

export interface Product {
  id: string;                 // local uuid
  source: ParsedLink;
  title: string;
  price: number;              // base price in 元
  description: string;        // plain text or HTML
  mainImage?: string;
  images: ProductImage[];
  skus: ProductSku[];
  category?: string;
  tags: string[];
  createdAt: number;
  status: "draft" | "fetched" | "ready" | "publishing" | "published" | "error";
  error?: string;
}

export interface PublishTask {
  id: string;
  productId: string;
  target: Platform;
  status: "pending" | "running" | "success" | "failed";
  message?: string;
  createdAt: number;
}
