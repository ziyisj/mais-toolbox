import { ParsedLink, Platform } from "../types/product";

/**
 * Parse a Chinese-ecom product URL into { platform, itemId }.
 * Handles full URLs and several short-link / share-text shapes.
 * Does NOT resolve short links (that requires a network call — done in adapters).
 */
export function parseProductLink(input: string): ParsedLink | null {
  const raw = input.trim();
  if (!raw) return null;

  // Try to extract a URL from share text like "...复制此链接,打开...https://..."
  const urlMatch = raw.match(/https?:\/\/[^\s,，"'<>]+/);
  const url = urlMatch ? urlMatch[0] : raw;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.hostname.toLowerCase();

  // ---- Taobao / Tmall ----
  if (/(^|\.)(taobao|tmall|tmall\.hk)\.com$/.test(host) || host.endsWith(".m.taobao.com")) {
    const id = u.searchParams.get("id") || extractFromPath(u.pathname, /\/item\/(\d+)/);
    if (id) return mk("taobao", id, raw, `https://item.taobao.com/item.htm?id=${id}`);
  }

  // ---- PDD ----
  if (/(^|\.)(pinduoduo|yangkeduo)\.com$/.test(host)) {
    const id = u.searchParams.get("goods_id") || extractFromPath(u.pathname, /\/goods\/(\d+)/);
    if (id) return mk("pdd", id, raw, `https://mobile.yangkeduo.com/goods.html?goods_id=${id}`);
  }

  // ---- Douyin / Toutiao ecom ----
  if (/(^|\.)(douyin|haohuo|jinritemai)\.com$/.test(host) || host.endsWith(".iesdouyin.com")) {
    const id =
      extractFromPath(u.pathname, /\/product\/(\d+)/) ||
      extractFromPath(u.pathname, /\/views\/product\/(\d+)/) ||
      u.searchParams.get("id");
    if (id) return mk("douyin", id, raw, `https://haohuo.jinritemai.com/views/product/item2?id=${id}`);
  }

  // ---- 1688 ----
  if (host.endsWith("1688.com")) {
    const id =
      extractFromPath(u.pathname, /\/offer\/(\d+)\.html/) ||
      extractFromPath(u.pathname, /\/offer\/(\d+)/);
    if (id) return mk("1688", id, raw, `https://detail.1688.com/offer/${id}.html`);
  }

  // ---- JD ----
  if (/(^|\.)(jd|jingdong)\.com$/.test(host) || host.endsWith(".m.jd.com")) {
    const id =
      extractFromPath(u.pathname, /\/(\d+)\.html/) ||
      u.searchParams.get("sku") ||
      u.searchParams.get("wareId");
    if (id) return mk("jd", id, raw, `https://item.jd.com/${id}.html`);
  }

  return mk("unknown", "", raw, url);
}

function extractFromPath(pathname: string, re: RegExp): string | null {
  const m = pathname.match(re);
  return m ? m[1] : null;
}

function mk(platform: Platform, itemId: string, rawUrl: string, normalizedUrl: string): ParsedLink {
  return { platform, itemId, rawUrl, normalizedUrl };
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  taobao: "淘宝/天猫",
  pdd: "拼多多",
  douyin: "抖音小店",
  "1688": "1688",
  jd: "京东",
  unknown: "未识别"
};
