import { useState } from "react";
import { parseProductLink, PLATFORM_LABEL } from "../lib/linkParser";
import { getSourceAdapter } from "../adapters/registry";
import { useStore } from "../store";
import { ParsedLink } from "../types/product";

export default function ImportPage() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<(ParsedLink & { line: string })[]>([]);
  const [busy, setBusy] = useState(false);
  const addProduct = useStore(s => s.addProduct);

  function handleParse() {
    const lines = text
      .split(/[\n\r]+/)
      .map(l => l.trim())
      .filter(Boolean);
    const out: (ParsedLink & { line: string })[] = [];
    for (const line of lines) {
      const p = parseProductLink(line);
      if (p) out.push({ ...p, line });
    }
    setParsed(out);
  }

  async function handleFetchAll() {
    setBusy(true);
    for (const link of parsed) {
      if (link.platform === "unknown") continue;
      const adapter = getSourceAdapter(link.platform);
      try {
        const product = await adapter.fetch(link);
        addProduct(product);
      } catch (e) {
        console.error("fetch failed", e);
      }
    }
    setBusy(false);
    setParsed([]);
    setText("");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-800">导入链接</h1>
      <p className="text-sm text-slate-500 mt-1">
        粘贴一个或多个商品链接(支持淘宝/拼多多/抖音/1688/京东),一行一个或包含分享文案均可。
      </p>

      <textarea
        className="mt-4 w-full h-48 p-3 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="https://item.taobao.com/item.htm?id=...&#10;https://mobile.yangkeduo.com/goods.html?goods_id=...&#10;复制此条消息,打开「抖音」搜索..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleParse}
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm font-medium"
        >
          解析
        </button>
        <button
          onClick={handleFetchAll}
          disabled={parsed.length === 0 || busy}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300 text-sm font-medium"
        >
          {busy ? "抓取中..." : `抓取 ${parsed.length} 个商品`}
        </button>
      </div>

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
    </div>
  );
}
