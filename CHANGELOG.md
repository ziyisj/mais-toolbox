# Changelog

## [0.1.1] - 2026-05-27

### Fixed
- **1688 抓取"假装成功"严重 bug** — v0.1.0 在 1688 反爬升级后,
  匿名直抓返回的是滑块验证页 / 登录重定向壳 / "已下架"模板,
  cheerio 解析全空,但 fallback `<title>` 让 `title` 字段非空,
  绕过了失败判断,**导致空商品被静默写入本地库,导出 xlsx 全部为空白行**。
  现在显式拦三类壳页:
  - 滑块验证页(`_____tmd_____` / `"action":"captcha"` / `rgv587_flag`)
    → "1688 触发滑块验证拦截"
  - 商品已下架页(`rax-ocms-wap-detail-404`) → "1688 商品已下架"
  - PC 站 windvane 重定向壳(< 8KB 只有 a-link/windvane.js)
    → "1688 PC 站要求登录"
  - 解析完成但 title 仅为默认值且无图无价 → "无有效商品数据"
  这些都会以红色错误显示在导入页,**不再写入商品库**。

### Known limitations
- 在风控升级后,**匿名 IP 几乎抓不到任何 1688 商品**。要重新拿到数据,
  v0.2 计划引入 Electron BrowserWindow 真浏览器抓取 + 登录态 cookie 持久化。
- 目前所有 1688 链接大概率都会得到"触发滑块"或"要求登录"错误,
  这是当前**正确**行为(老老实实告诉你抓不到),而不是 v0.1.0 那种假装成功。

## [0.1.0] - 2026-05-26

### Added
- **GitHub Actions release workflow** (`.github/workflows/release.yml`) —
  push a `v*.*.*` tag to build Windows / macOS / Linux installers and
  publish a draft GitHub Release. Manual run builds artifacts only.
- **Electron main-process fetcher** (`electron/fetcher.ts`) — uses
  Chromium's `net` stack for cookie / TLS / gzip handling, manual redirect
  following, configurable timeout.
- **Short-link resolver** (`electron/linkResolver.ts`) — unwraps
  `m.tb.cn` / `v.douyin.com` / `p.yangkeduo.com` / `u.jd.com` /
  `qr.1688.com` and similar share-link wrappers via redirect chain,
  meta-refresh, and JS `location` parsing.
- **Real 1688 source adapter** (`electron/sourceFetchers.ts`) — parses
  detail page HTML + inline `__NEXT_DATA__` JSON to extract title,
  price, images, description. Works on public items without login.
- **IPC bridge** for renderer to call the main-process fetcher
  (`electron/preload.ts`, `src/adapters/ipcSource.ts`).
- **Progress + error UI** in import page — shows `N/M` while fetching,
  lists per-item errors after.
- **Link parser smoke tests** (`src/lib/linkParser.test.ts`).
- electron-builder configured for Win NSIS / macOS DMG (x64 + arm64) /
  Linux AppImage with stable artifact names.
- Initial scaffold: Electron + React + TS + Tailwind, link parser,
  adapter架构, 4 pages, export JSON/Excel.

### Notes
- Taobao / Tmall / PDD / Douyin / JD adapters still return a clear
  `AUTH_REQUIRED` error pointing to the credentials they need.
- 1688 will return `登录墙` errors on items that require account
  login — that's expected behavior; the error UI surfaces it cleanly.
