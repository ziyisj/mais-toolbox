import { PageKey } from "../App";

const items: { key: PageKey; label: string; icon: string }[] = [
  { key: "import", label: "导入链接", icon: "🔗" },
  { key: "products", label: "商品列表", icon: "📦" },
  { key: "publish", label: "发布任务", icon: "🚀" },
  { key: "settings", label: "设置", icon: "⚙️" }
];

export default function Sidebar({
  current, onChange
}: { current: PageKey; onChange: (p: PageKey) => void }) {
  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-lg font-semibold">迈斯工具箱</div>
        <div className="text-xs text-slate-400 mt-0.5">Mais Toolbox v0.1</div>
      </div>
      <nav className="flex-1 py-3">
        {items.map(it => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`w-full text-left px-5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
              current === it.key
                ? "bg-brand-600 text-white"
                : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <span>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-5 py-3 text-xs text-slate-500 border-t border-slate-800">
        商品搬家骨架版
      </div>
    </aside>
  );
}
