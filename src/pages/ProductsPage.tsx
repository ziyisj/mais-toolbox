import { useStore } from "../store";
import { PLATFORM_LABEL } from "../lib/linkParser";

export default function ProductsPage() {
  const products = useStore(s => s.products);
  const removeProduct = useStore(s => s.removeProduct);

  async function exportJson() {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    download(blob, `mais-products-${Date.now()}.json`);
  }

  async function exportXlsx() {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("商品");
    ws.columns = [
      { header: "ID", key: "id", width: 38 },
      { header: "平台", key: "platform", width: 12 },
      { header: "商品ID", key: "itemId", width: 18 },
      { header: "标题", key: "title", width: 40 },
      { header: "价格", key: "price", width: 10 },
      { header: "状态", key: "status", width: 12 },
      { header: "原链接", key: "url", width: 50 }
    ];
    products.forEach(p =>
      ws.addRow({
        id: p.id,
        platform: PLATFORM_LABEL[p.source.platform],
        itemId: p.source.itemId,
        title: p.title,
        price: p.price,
        status: p.status,
        url: p.source.normalizedUrl
      })
    );
    const buf = await wb.xlsx.writeBuffer();
    download(new Blob([buf]), `mais-products-${Date.now()}.xlsx`);
  }

  function download(blob: Blob, name: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">商品列表</h1>
          <p className="text-sm text-slate-500 mt-1">共 {products.length} 个商品</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportJson}
            disabled={products.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm disabled:opacity-50"
          >
            导出 JSON
          </button>
          <button
            onClick={exportXlsx}
            disabled={products.length === 0}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-50"
          >
            导出 Excel
          </button>
        </div>
      </div>

      <div className="mt-5 bg-white rounded-lg border border-slate-200 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            还没有商品,去「导入链接」页粘贴几个试试。
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">平台</th>
                <th className="px-3 py-2 text-left">标题</th>
                <th className="px-3 py-2 text-left">商品 ID</th>
                <th className="px-3 py-2 text-left">价格</th>
                <th className="px-3 py-2 text-left">状态</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs">{PLATFORM_LABEL[p.source.platform]}</td>
                  <td className="px-3 py-2 max-w-md truncate">{p.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.source.itemId}</td>
                  <td className="px-3 py-2">¥{p.price.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "published"
      ? "bg-emerald-100 text-emerald-700"
      : status === "error"
      ? "bg-rose-100 text-rose-700"
      : status === "publishing"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{status}</span>;
}
