import { useState } from "react";
import { useStore } from "../store";
import { Platform } from "../types/product";
import { getTargetAdapter } from "../adapters/registry";
import { uuid } from "../lib/uuid";
import { PLATFORM_LABEL } from "../lib/linkParser";

const TARGETS: { value: Platform; label: string }[] = [
  { value: "taobao", label: "淘宝/天猫" },
  { value: "pdd", label: "拼多多" },
  { value: "douyin", label: "抖音小店" },
  { value: "1688", label: "1688" },
  { value: "jd", label: "京东" }
];

export default function PublishPage() {
  const products = useStore(s => s.products);
  const tasks = useStore(s => s.tasks);
  const addTask = useStore(s => s.addTask);
  const updateTask = useStore(s => s.updateTask);
  const updateProduct = useStore(s => s.updateProduct);

  const [target, setTarget] = useState<Platform>("pdd");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);

  function toggle(id: string) {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function runBatch() {
    setRunning(true);
    const ids = [...selected];
    for (const pid of ids) {
      const product = products.find(p => p.id === pid);
      if (!product) continue;
      const task = {
        id: uuid(),
        productId: pid,
        target,
        status: "running" as const,
        createdAt: Date.now()
      };
      addTask(task);
      updateProduct(pid, { status: "publishing" });
      try {
        const adapter = getTargetAdapter(target);
        const result = await adapter.publish(product);
        updateTask(task.id, { status: "success", message: result.url });
        updateProduct(pid, { status: "published" });
      } catch (e: any) {
        updateTask(task.id, { status: "failed", message: e.message });
        updateProduct(pid, { status: "error", error: e.message });
      }
    }
    setSelected(new Set());
    setRunning(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">发布任务</h1>
      <p className="text-sm text-slate-500 mt-1">勾选商品,选择目标平台,批量发布。</p>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-slate-600">目标平台:</label>
        <select
          value={target}
          onChange={e => setTarget(e.target.value as Platform)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
        >
          {TARGETS.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={runBatch}
          disabled={selected.size === 0 || running}
          className="px-4 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300 text-sm font-medium"
        >
          {running ? "发布中..." : `发布选中的 ${selected.size} 个`}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <section>
          <h2 className="text-sm font-medium text-slate-600 mb-2">可发布商品</h2>
          <div className="bg-white rounded-lg border border-slate-200 max-h-96 overflow-auto">
            {products.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">无商品</div>
            ) : (
              products.map(p => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="text-xs text-slate-500 w-16">
                    {PLATFORM_LABEL[p.source.platform]}
                  </span>
                  <span className="flex-1 truncate">{p.title}</span>
                </label>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-600 mb-2">任务历史</h2>
          <div className="bg-white rounded-lg border border-slate-200 max-h-96 overflow-auto">
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">还没有任务</div>
            ) : (
              tasks.map(t => {
                const p = products.find(x => x.id === t.productId);
                return (
                  <div key={t.id} className="px-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          t.status === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "failed"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-xs text-slate-500">→ {PLATFORM_LABEL[t.target]}</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-1">{p?.title || t.productId}</div>
                    {t.message && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">{t.message}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
