import { useState } from "react";
import { useStore } from "../store";
import { Platform } from "../types/product";
import { PLATFORM_LABEL } from "../lib/linkParser";

const PLATFORMS: Platform[] = ["taobao", "pdd", "douyin", "1688", "jd"];

export default function SettingsPage() {
  const credentials = useStore(s => s.credentials);
  const setCredential = useStore(s => s.setCredential);
  const [draft, setDraft] = useState(credentials);

  function save() {
    for (const p of PLATFORMS) {
      const c = draft[p];
      if (c) setCredential(p, c);
    }
    alert("已保存(仅在内存中,刷新会丢失。持久化待实现)。");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-800">设置</h1>
      <p className="text-sm text-slate-500 mt-1">
        填入各平台开放平台的 App Key / Secret / Access Token。<br/>
        <span className="text-rose-600">
          骨架版未对接真实 API,这里只存到内存。
        </span>
      </p>

      <div className="mt-5 space-y-4">
        {PLATFORMS.map(p => {
          const c = draft[p] || { appKey: "", appSecret: "", accessToken: "" };
          return (
            <div key={p} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="font-medium text-slate-700 mb-3">{PLATFORM_LABEL[p]}</div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="App Key"
                  value={c.appKey}
                  onChange={v => setDraft(d => ({ ...d, [p]: { ...c, appKey: v } }))}
                />
                <Input
                  label="App Secret"
                  value={c.appSecret}
                  type="password"
                  onChange={v => setDraft(d => ({ ...d, [p]: { ...c, appSecret: v } }))}
                />
                <Input
                  label="Access Token"
                  value={c.accessToken}
                  type="password"
                  onChange={v => setDraft(d => ({ ...d, [p]: { ...c, accessToken: v } }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        className="mt-5 px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 text-sm font-medium"
      >
        保存
      </button>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text"
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}
