import { SourceAdapter, TargetAdapter } from "./types";
import { Platform } from "../types/product";
import { stubSourceAdapter } from "./sourceStub";
import { stubTargetAdapter } from "./targetStub";

// All platforms currently route to the stub. Replace per-platform as you实现 each one.
export function getSourceAdapter(_p: Platform): SourceAdapter {
  return stubSourceAdapter;
}

export function getTargetAdapter(_p: Platform): TargetAdapter {
  return stubTargetAdapter;
}
