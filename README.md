# 迈斯工具箱 (Mais Toolbox)

> 类「破军星工具箱」的跨电商平台**商品搬家**桌面工具骨架。
>
> 状态:**v0.1 骨架版** — UI、链接解析、适配器架构、导出都已实现;真实抓取/发布需自行接入。

## 是什么

把淘宝 / 拼多多 / 抖音小店 / 1688 / 京东上的商品,**搬**到另一个平台。

```
源平台商品链接  →  解析 + 抓取  →  本地商品库  →  发布到目标平台
```

## 当前功能

| 功能 | 状态 |
|---|---|
| Electron + React + TS + Tailwind 桌面外壳 | ✅ |
| 多链接粘贴 / 批量解析(支持分享文案抽取 URL) | ✅ |
| 平台识别:淘宝、天猫、拼多多、抖音、1688、京东 | ✅ |
| 本地商品列表 + 状态机 | ✅ |
| 批量发布任务 + 历史 | ✅ |
| 导出 JSON / Excel | ✅ |
| 凭据设置 UI(各平台 App Key / Secret / Token) | ✅(仅内存,无持久化) |
| 适配器架构(SourceAdapter / TargetAdapter) | ✅ |
| **真实商品抓取** | 🚧 stub,见 `src/adapters/sourceStub.ts` |
| **真实平台发布** | 🚧 stub,见 `src/adapters/targetStub.ts` |
| 凭据持久化(electron-store / sqlite) | 🚧 |
| 自动更新、打包签名 | 🚧 |

## 技术栈

- **Electron 31** — 跨平台桌面外壳
- **Vite 5 + React 18 + TypeScript 5** — 渲染层
- **Tailwind CSS 3** — 样式
- **Zustand 4** — 状态管理
- **ExcelJS** — Excel 导出

## 开发

```bash
git clone git@github.com:ziyisj/mais-toolbox.git
cd mais-toolbox
npm install
npm run electron:dev    # 同时启动 Vite + Electron
```

打包:

```bash
npm run electron:build  # 产物在 release/
```

## 项目结构

```
mais-toolbox/
├── electron/           # 主进程 + preload
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── adapters/       # 平台适配器(源/目标)
│   │   ├── types.ts
│   │   ├── sourceStub.ts
│   │   ├── targetStub.ts
│   │   └── registry.ts
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── linkParser.ts   # 链接 → {platform, itemId}
│   │   └── uuid.ts
│   ├── pages/
│   │   ├── ImportPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── PublishPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/index.ts      # Zustand store
│   ├── types/product.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.electron.json
└── vite.config.ts
```

## 如何接入真实平台

1. 在 `src/adapters/` 下新建 `taobaoSource.ts`(以及对应的 target):

   ```ts
   import { SourceAdapter } from "./types";
   export const taobaoSource: SourceAdapter = {
     platform: "taobao",
     async fetch(link) {
       // 调用 taobao.item.get / 走商户授权 / 或带 cookie 的 Playwright
       // ...
       return product;
     }
   };
   ```

2. 在 `src/adapters/registry.ts` 注册:

   ```ts
   import { taobaoSource } from "./taobaoSource";
   const SOURCES = { taobao: taobaoSource, /* ... */ };
   export function getSourceAdapter(p: Platform) {
     return SOURCES[p] ?? stubSourceAdapter;
   }
   ```

3. 在「设置」页填入对应平台的 App Key / Secret / Access Token,
   在 adapter 内通过 `useStore.getState().credentials[platform]` 读取。

## 各平台对接参考

| 平台 | 商品详情 API | 发布 API | 备注 |
|---|---|---|---|
| 淘宝/天猫 | `taobao.item.get` | `taobao.item.add` | 开放平台,需类目权限 |
| 拼多多 | `pdd.ddk.goods.detail` | `pdd.goods.add` | 多多客 / 商家版 |
| 抖音小店 | 抖店 `product/detail/v2` | `product/add/v2` | 店铺授权 |
| 1688 | `alibaba.icbu.product.get` | `alibaba.icbu.product.schema.add` | 阿里开放平台 |
| 京东 | 联盟 `jd.union.open.goods...` | POP `vc.item.add` | 商家资质 |

无商户资质时,可用 **Playwright 带登录态**抓取,但要自行处理反爬、风控、滑块。

## 许可证

MIT
