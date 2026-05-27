import * as cheerio from "cheerio";
import { smartFetch } from "./fetcher";
import { resolveShortLink } from "./linkResolver";

export interface FetchedProduct {
  platform: string;
  itemId: string;
  sourceUrl: string;
  title: string;
  price: number;
  description: string;
  mainImage: string | null;
  images: { url: string; alt?: string }[];
  raw?: Record<string, any>;
}

/**
 * Dispatch to the right scraper based on parsed URL.
 *
 * NOTE on reality:
 *   - 1688 detail pages serve a JS-rendered SPA but ALSO inline a JSON blob
 *     "window.__INIT_DATA__ = { ... }" in the HTML — we parse that. Works
 *     without login for most public items, will return empty for login-walled ones.
 *   - Taobao / Tmall / PDD / Douyin require login state + signed API calls.
 *     Stubs here throw a clear error pointing to next steps.
 */
export async function fetchProduct(rawInput: string): Promise<FetchedProduct> {
  const resolved = await resolveShortLink(rawInput);
  const u = new URL(resolved);
  const host = u.hostname.toLowerCase();

  if (host.endsWith("1688.com")) return fetch1688(resolved, u);
  if (/(taobao|tmall)\.com$/.test(host) || host.endsWith(".m.taobao.com"))
    throw needsAuthError("淘宝/天猫", "需要登录态 cookie 或商户 App Key,后续接入。");
  if (/(pinduoduo|yangkeduo)\.com$/.test(host))
    throw needsAuthError("拼多多", "需要多多客 access_token,后续接入。");
  if (/(douyin|haohuo|jinritemai|iesdouyin)\.com$/.test(host))
    throw needsAuthError("抖音小店", "需要抖店开放平台 access_token,后续接入。");
  if (/(jd|jingdong)\.com$/.test(host))
    throw needsAuthError("京东", "需要 POP 商家 / 联盟接口,后续接入。");

  throw new Error(`暂不支持的平台:${host}`);
}

function needsAuthError(platformName: string, hint: string): Error {
  const e = new Error(`${platformName} 抓取需要凭据:${hint}`);
  (e as any).code = "AUTH_REQUIRED";
  return e;
}

// ===========================================================================
// 1688
// ===========================================================================
async function fetch1688(url: string, u: URL): Promise<FetchedProduct> {
  const idMatch = u.pathname.match(/\/offer\/(\d+)/);
  const itemId = idMatch ? idMatch[1] : "";

  const res = await smartFetch({
    url,
    timeoutMs: 15000,
    headers: {
      Referer: "https://www.1688.com/"
    }
  });

  if (res.status !== 200) {
    throw new Error(`1688 返回 HTTP ${res.status},可能被风控,可尝试在浏览器手动打开后导出 cookie。`);
  }

  // ── 风控/失效页拦截(2026-05 1688 反爬升级后,匿名直抓基本都落到这些壳里) ──
  // 1) 滑块验证页:`_tmd_/punish`、`action":"captcha"`、`rgv587_flag:sm`
  if (/_____tmd_____|"action":\s*"captcha"|rgv587_flag/.test(res.body)) {
    throw new Error(
      "1688 触发滑块验证拦截(IP 已被风控)。无法匿名抓取,需要登录态 cookie 或浏览器抓取模式(v0.2 计划支持)。"
    );
  }
  // 2) 商品已下架模板
  if (/rax-ocms-wap-detail-404|"pageName":\s*"1688商品无法查看或已下架"/.test(res.body)) {
    throw new Error("1688 商品已下架或无法查看。请确认链接有效。");
  }
  // 3) PC 站 windvane 重定向壳(< 8KB 且只有 a-link/windvane.js,没任何商品数据)
  if (
    res.body.length < 8000 &&
    /<a id="a-link"><\/a>/.test(res.body) &&
    /windvane\.js/.test(res.body) &&
    !/__NEXT_DATA__|offerTitle|priceInfo/.test(res.body)
  ) {
    throw new Error(
      "1688 PC 站要求登录后访问详情页(返回了重定向壳,无商品数据)。需要登录态 cookie 或浏览器抓取模式(v0.2 计划支持)。"
    );
  }

  const $ = cheerio.load(res.body);

  // Pull JSON from inline scripts — 1688 stuffs initial state into __NEXT_DATA__ or window.__GLOBAL_DATA
  let title = "";
  let price = 0;
  let images: string[] = [];
  let description = "";

  // Try Next.js style
  const nextData = $("#__NEXT_DATA__").html();
  if (nextData) {
    try {
      const obj = JSON.parse(nextData);
      const dig = (o: any, depth = 0): void => {
        if (!o || depth > 6) return;
        if (typeof o === "object") {
          for (const k of Object.keys(o)) {
            const v = o[k];
            if (!title && k === "subject" && typeof v === "string") title = v;
            if (!title && k === "title" && typeof v === "string" && v.length > 5) title = v;
            if (!price && (k === "priceRange" || k === "price") && typeof v === "string") {
              const m = v.match(/(\d+(?:\.\d+)?)/);
              if (m) price = parseFloat(m[1]);
            }
            if (Array.isArray(v) && k.toLowerCase().includes("image")) {
              for (const it of v) {
                if (typeof it === "string" && /^https?:.+\.(jpg|jpeg|png|webp)/i.test(it)) images.push(it);
                else if (it?.fullPathImageURI) images.push(it.fullPathImageURI);
                else if (it?.url) images.push(it.url);
              }
            }
            dig(v, depth + 1);
          }
        }
      };
      dig(obj);
    } catch {}
  }

  // Fallbacks via DOM/meta
  if (!title) title = $('meta[name="keywords"]').attr("content") || $("title").text().trim();
  if (title) title = title.replace(/[-_|].*?(1688|阿里巴巴).*$/i, "").trim();

  if (!images.length) {
    $('img[src*="alicdn"]').each((_i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && /\.(jpg|jpeg|png|webp)/i.test(src)) images.push(src.startsWith("//") ? "https:" + src : src);
    });
  }

  if (!price) {
    const priceText = $('meta[property="og:price"]').attr("content") || "";
    const m = priceText.match(/(\d+(?:\.\d+)?)/);
    if (m) price = parseFloat(m[1]);
  }

  description = $('meta[name="description"]').attr("content") || "";

  if (!title) {
    throw new Error("1688 页面解析失败 — 可能是登录墙或风控页。请在浏览器打开链接确认。");
  }

  // 防御性检查:即使有 title,如果是默认 <title>1688</title> / 无图 / 无价,也算失败,
  // 别把空壳塞进本地商品库(v0.1.0 的 bug:导出 xlsx 全空就是因为这里没拦)
  const titleIsTrivial = /^(1688|阿里巴巴|阿里巴巴1688|1688\.com)$/i.test(title.trim()) || title.trim().length < 4;
  if (titleIsTrivial && images.length === 0 && price === 0) {
    throw new Error(
      "1688 页面无有效商品数据(title 是默认值且无图无价)。链接可能已被风控、登录墙拦截或商品已下架。"
    );
  }

  // Dedupe images
  images = [...new Set(images)].slice(0, 20);

  return {
    platform: "1688",
    itemId,
    sourceUrl: url,
    title,
    price,
    description,
    mainImage: images[0] || null,
    images: images.map(u => ({ url: u })),
    raw: { contentLength: res.body.length, hadNextData: !!nextData }
  };
}
