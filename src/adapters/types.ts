import { ParsedLink, Product } from "../types/product";

/** A SourceAdapter fetches a商品 from a source platform given a parsed link. */
export interface SourceAdapter {
  platform: ParsedLink["platform"];
  /**
   * Fetch and normalize a商品.
   * NOTE: real fetching requires login state, anti-bot handling, and商户 API access.
   * This骨架 returns a placeholder Product so the UI can flow end-to-end.
   */
  fetch(link: ParsedLink): Promise<Product>;
}

/** A TargetAdapter publishes a Product to a target platform. */
export interface TargetAdapter {
  platform: ParsedLink["platform"];
  /** Returns the published URL or商品ID on success. */
  publish(product: Product): Promise<{ url: string; remoteId: string }>;
}
