# Changelog

## [0.1.1] - 2026-05-26

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

### Notes
- Taobao / Tmall / PDD / Douyin / JD adapters still return a clear
  `AUTH_REQUIRED` error pointing to the credentials they need. Filling
  those in is the next obvious step.
- 1688 will return `登录墙` errors on items that require account
  login — that's expected behavior; the error UI surfaces it cleanly.

## [0.1.0] - 2026-05-26
- Initial scaffold: Electron + React + TS + Tailwind, link parser,
  adapter架构, 4 pages, export JSON/Excel.
