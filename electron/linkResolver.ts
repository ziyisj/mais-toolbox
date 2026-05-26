import { smartFetch } from "./fetcher";

/**
 * Resolve short URLs / share-text wrappers used by Chinese e-com platforms.
 *
 * Supports:
 *   - m.tb.cn  (淘宝短链)
 *   - tb.cn    (淘宝短链)
 *   - p.pinduoduo.com / p.yangkeduo.com (拼多多)
 *   - v.douyin.com / v.kuaishou.com (抖音 / 快手)
 *   - m.tb.cn-style raw share text ("xxx 复制此链接...https://m.tb.cn/h.XXX...")
 *
 * Strategy: send a HEAD-like GET that does not follow redirects (we follow manually),
 * grab the first 1-2 hops which usually reveal the real URL via Location header
 * or via a meta-refresh / window.location in the HTML.
 */

const SHORT_HOSTS = [
  "m.tb.cn", "tb.cn",
  "p.pinduoduo.com", "p.yangkeduo.com", "mobile.yangkeduo.com",
  "v.douyin.com", "v.kuaishou.com",
  "u.jd.com", "3.cn", "item.m.jd.com",
  "qr.1688.com"
];

export async function resolveShortLink(input: string): Promise<string> {
  // Extract first URL from share text
  const urlMatch = input.match(/https?:\/\/[^\s,，"'<>]+/);
  if (!urlMatch) return input.trim();
  let url = urlMatch[0];

  // Up to 3 unwrap iterations
  for (let i = 0; i < 3; i++) {
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return url;
    }
    if (!SHORT_HOSTS.some(h => host === h || host.endsWith("." + h))) return url;

    try {
      const res = await smartFetch({ url, followRedirect: true, timeoutMs: 8000 });
      if (res.finalUrl && res.finalUrl !== url) {
        url = res.finalUrl;
        continue;
      }
      // Look for meta-refresh or JS redirect in body
      const meta = res.body.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+url=([^"'>\s]+)/i);
      if (meta) {
        url = new URL(meta[1], url).toString();
        continue;
      }
      const jsLoc = res.body.match(/(?:window\.location(?:\.href)?|location\.replace)\s*=\s*["']([^"']+)["']/);
      if (jsLoc) {
        url = new URL(jsLoc[1], url).toString();
        continue;
      }
      return url;
    } catch (e) {
      return url; // give up, return whatever we have
    }
  }
  return url;
}
