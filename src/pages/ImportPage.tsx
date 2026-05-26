import { useState } from "react";
import { parseProductLink, PLATFORM_LABEL } from "../lib/linkParser";
import { getSourceAdapter } from "../adapters/registry";
import { useStore } from "../store";
import { ParsedLink } from "../types/product";

interface ParsedRow extends ParsedLink {
  line: string;
}

export default function ImportPage() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string }>({
    done: 0, total: 0, current: ""
  });
  const [errors, setErrors] = useState<string[]>([]);
  const addProduct = useStore(s => s.addProduct);

  async function handleParse() {
    setResolving(true);
    setErrors([]);
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
    const out: ParsedRow[] = [];
    for (const line of lines) {
      let working = line;
      // If we're in Electron and the line looks like a known short link / share text,
      // resolve it via the main process so we get the real URL.
      if (window.mais && /(?:m\.tb\.cn|tb\.cn|v\.douyin\.com|p\.pinduoduo\.com|p\.yangkeduo\.com|u\.jd\.com|3\.cn|qr\.1688\.com)/.test(line)) {
        try {
          const r = await window.mais.resolveLink(line);
          if (r.ok) working = r.url;
        } catch {}
      }
      const p = parseProductLink(working);
      if (p) out.push({ ...p, line });
    }
    setParsed(out);
    setResolving(false);
  }

  async function handleFetchAll() {
    setBusy(true);
    setProgress({ done: 0, total: parsed.length, current: "" });
    const errs: string[] = [];
    let done = 0;
    for (const link of parsed) {
      setProgress({ done, total: parsed.length, current: link.normalizedUrl });
      if (link.platform === "unknown") {
        errs.push(`未识别:${link.line}`);
        done++;
        continue;
      }
      const adapter = getSourceAdapter(link.platform);
      try {
        const product = await adapter.fetch(link);
        addProduct(product);
      } catch (e: any) {
        errs.push(`${PLATFORM_LABEL[link.platform]} ${link.itemId}:${e.message || e}`);
      }
      done++;
    }
    setBusy(false);
    setProgress({ done: parsed.length, total: parsed.length, current: "" });
    setErrors(errs);
    setParsed([]);
    setText("");
  }

  const inElectron = typeof window !== "undefined" && !!window.mais;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-800">导入链接</h1>
      <p className="text-sm text-slate-500 mt-1">
        粘贴一个或多个商品链接(支持淘宝/拼多多/抖音/1688/京东),一行一个或包含分享文案均可。
      </p>

      {!inElectron && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          ⚠️ 浏览器预览模式 — 真实抓取需要 Electron 环境(<code>npm run electron:dev</code>)。
          这里只能用占位数据。
        </div>
      )}

      <textarea
        className="mt-4 w-full h-48 p-3 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="https://detail.1688.com/offer/XXXXX.html&#10;https://item.taobao.com/item.htm?id=...&#10;复制此条消息,打开「抖音」搜索..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleParse}
          disabled={resolving || busy}
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm font-medium disabled:opacity-50"
        >
          {resolving ? "解析中..." : "解析"}
        </button>
        <button
          onClick={handleFetchAll}
          disabled={parsed.length === 0 || busy}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300 text-sm font-medium"
        >
          {busy ? `抓取中 ${progress.done}/${progress.total}` : `抓取 ${parsed.length} 个商品`}
        </button>
      </div>

      {busy && progress.current && (
        <div className="mt-3 text-xs text-slate-500 truncate">正在抓取:{progress.current}</div>
      )}

      {parsed.length > 0 && (
        <div className="mt-5 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">平台</th>
                <th className="px-3 py-2 text-left">商品 ID</th>
                <th className="px-3 py-2 text-left">规范 URL</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((p, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        p.platform === "unknown"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {PLATFORM_LABEL[p.platform]}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.itemId || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500 truncate max-w-md">
                    {p.normalizedUrl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-5 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
          <div className="font-medium mb-1">抓取问题(共 {errors.length} 条):</div>
          <ul className="list-disc pl-5 space-y-0.5 text-xs">
            {errors.map((e, i) => (
              <li key={i} className="break-all">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
