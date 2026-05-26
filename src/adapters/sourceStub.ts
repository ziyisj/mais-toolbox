import { SourceAdapter } from "./types";
import { ParsedLink, Product } from "../types/product";
import { uuid } from "../lib/uuid";
import { PLATFORM_LABEL } from "../lib/linkParser";

/**
 * Placeholder source adapter — returns a fake但结构完整的 Product so the UI
 * pipeline can be tested. Replace with real implementations:
 *
 *   - Taobao: needs login cookie + 反爬, often via Playwright headful session.
 *             商户可走开放平台 taobao.item.get(需要 App Key + 类目权限).
 *   - PDD:    pdd.ddk.goods.detail (多多客 API, 需要 client_id / secret).
 *   - Douyin: 抖店开放平台 product/detail/v2 (需要店铺授权 token).
 *   - 1688:   alibaba.icbu.product.get / scrape detail.1688.com.
 *   - JD:     联盟 jd.union.open.goods.promotiongoodsinfo.query.
 *
 * All of those require credentials the user must obtain themselves.
 */
export const stubSourceAdapter: SourceAdapter = {
  platform: "unknown",
  async fetch(link: ParsedLink): Promise<Product> {
    // Simulate network latency
    await new Promise(r => setTimeout(r, 600));

    return {
      id: uuid(),
      source: link,
      title: `[占位] ${PLATFORM_LABEL[link.platform]} 商品 ${link.itemId || "(未识别 ID)"}`,
      price: 0,
      description:
        "这是骨架版占位数据。\n\n要拿到真实商品信息,需要在 src/adapters/ 下" +
        "实现对应平台的 SourceAdapter,接入官方商户 API 或带登录态的 Playwright 爬虫。",
      images: [],
      skus: [],
      tags: [],
      createdAt: Date.now(),
      status: "fetched"
    };
  }
};
