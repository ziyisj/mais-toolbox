import { TargetAdapter } from "./types";
import { Product } from "../types/product";

/**
 * Placeholder target adapter. Real publish flows:
 *
 *   - Taobao: taobao.item.add / taobao.item.update (开放平台, 商户授权).
 *   - PDD:    pdd.goods.add (商户授权 access_token).
 *   - Douyin: 抖店 product/add/v2.
 *   - 1688:   alibaba.icbu.product.schema.add.
 *   - JD:     vc.item.add (POP 商家).
 *
 * 这些都需要店铺资质和 API 授权,无法在骨架里直接跑通。
 */
export const stubTargetAdapter: TargetAdapter = {
  platform: "unknown",
  async publish(product: Product) {
    await new Promise(r => setTimeout(r, 800));
    // Randomly fail 10% to让 UI 错误态可见
    if (Math.random() < 0.1) {
      throw new Error("(占位)目标平台 API 未配置 — 请在 设置 中填入凭据");
    }
    return {
      url: "https://example.com/fake-published-item",
      remoteId: "FAKE-" + Math.random().toString(36).slice(2, 10).toUpperCase()
    };
  }
};
