import { net } from "electron";
import * as zlib from "node:zlib";

export interface FetchOptions {
  url: string;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: string;
  /** Manually handle 3xx so we can capture the resolved URL. Default true. */
  followRedirect?: boolean;
  /** Max redirects to follow. Default 6. */
  maxRedirects?: number;
  timeoutMs?: number;
}

export interface FetchResult {
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  body: string;
}

const UA_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Use Electron's `net` module (uses Chromium net stack — better cookie / TLS / HTTP/2 handling
 * than node's built-in https for sites with bot detection).
 * Manually follow redirects so we can return the final URL.
 */
export async function smartFetch(opts: FetchOptions): Promise<FetchResult> {
  const maxRedirects = opts.maxRedirects ?? 6;
  const followRedirect = opts.followRedirect ?? true;
  let url = opts.url;
  let redirects = 0;

  while (true) {
    const result = await rawFetch(url, opts);
    if (
      followRedirect &&
      result.status >= 300 &&
      result.status < 400 &&
      result.headers["location"] &&
      redirects < maxRedirects
    ) {
      url = new URL(result.headers["location"], url).toString();
      redirects++;
      continue;
    }
    return { ...result, finalUrl: url };
  }
}

function rawFetch(
  url: string,
  opts: FetchOptions
): Promise<Omit<FetchResult, "finalUrl">> {
  return new Promise((resolve, reject) => {
    const req = net.request({
      url,
      method: opts.method || "GET",
      redirect: "manual"
    });

    req.setHeader("User-Agent", opts.headers?.["User-Agent"] || UA_DESKTOP);
    req.setHeader(
      "Accept",
      opts.headers?.["Accept"] ||
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    );
    req.setHeader("Accept-Language", opts.headers?.["Accept-Language"] || "zh-CN,zh;q=0.9,en;q=0.8");
    req.setHeader("Accept-Encoding", "gzip, deflate");
    for (const [k, v] of Object.entries(opts.headers || {})) {
      if (!["User-Agent", "Accept", "Accept-Language", "Accept-Encoding"].includes(k)) {
        req.setHeader(k, v);
      }
    }

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          req.abort();
          reject(new Error(`fetch timeout after ${opts.timeoutMs}ms: ${url}`));
        }, opts.timeoutMs)
      : null;

    req.on("response", response => {
      const chunks: Buffer[] = [];
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(response.headers)) {
        headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
      }

      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        if (timer) clearTimeout(timer);
        let buf = Buffer.concat(chunks);
        const enc = headers["content-encoding"];
        try {
          if (enc === "gzip") buf = zlib.gunzipSync(buf);
          else if (enc === "deflate") buf = zlib.inflateSync(buf);
        } catch (e) {
          // body wasn't actually compressed despite header — fall through
        }
        const charset = (headers["content-type"] || "").match(/charset=([^;]+)/i)?.[1] || "utf-8";
        let body: string;
        try {
          body = new TextDecoder(charset.toLowerCase() as any).decode(buf);
        } catch {
          body = buf.toString("utf-8");
        }
        resolve({ status: response.statusCode, headers, body });
      });
      response.on("error", (e: Error) => {
        if (timer) clearTimeout(timer);
        reject(e);
      });
    });

    req.on("error", err => {
      if (timer) clearTimeout(timer);
      reject(err);
    });

    if (opts.body) req.write(opts.body);
    req.end();
  });
}
