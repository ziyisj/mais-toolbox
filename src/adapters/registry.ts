import { SourceAdapter, TargetAdapter } from "./types";
import { Platform } from "../types/product";
import { stubSourceAdapter } from "./sourceStub";
import { stubTargetAdapter } from "./targetStub";
import { ipcSourceAdapter } from "./ipcSource";

/**
 * Source routing:
 *   - 1688 → IPC to main-process scraper (real fetcher)
 *   - other platforms → stub (until adapters are implemented)
 *
 * Falls back to stub when window.mais is undefined (e.g. Vite dev page loaded
 * outside Electron, or unit tests).
 */
export function getSourceAdapter(p: Platform): SourceAdapter {
  if (typeof window !== "undefined" && window.mais && p === "1688") {
    return ipcSourceAdapter;
  }
  return stubSourceAdapter;
}

export function getTargetAdapter(_p: Platform): TargetAdapter {
  return stubTargetAdapter;
}
