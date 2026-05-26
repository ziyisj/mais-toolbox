// Lightweight assertion-style smoke tests. Run via: npx tsx src/lib/linkParser.test.ts
import { parseProductLink } from "./linkParser";

function eq(a: any, b: any, msg: string) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.error(`✗ ${msg}\n  expected ${JSON.stringify(b)}\n  got      ${JSON.stringify(a)}`);
    process.exit(1);
  } else {
    console.log(`✓ ${msg}`);
  }
}

const cases: { input: string; platform: string; itemId: string }[] = [
  { input: "https://item.taobao.com/item.htm?id=123456789", platform: "taobao", itemId: "123456789" },
  { input: "https://detail.tmall.com/item.htm?id=987&spm=x", platform: "taobao", itemId: "987" },
  { input: "https://mobile.yangkeduo.com/goods.html?goods_id=55555", platform: "pdd", itemId: "55555" },
  { input: "https://detail.1688.com/offer/777777777.html", platform: "1688", itemId: "777777777" },
  { input: "https://item.jd.com/100012043978.html", platform: "jd", itemId: "100012043978" },
  { input: "复制这条消息,打开手机淘宝 https://item.taobao.com/item.htm?id=111", platform: "taobao", itemId: "111" }
];

for (const c of cases) {
  const r = parseProductLink(c.input);
  eq(r?.platform, c.platform, `platform for "${c.input.slice(0, 40)}..."`);
  eq(r?.itemId, c.itemId, `itemId for "${c.input.slice(0, 40)}..."`);
}

console.log(`\n${cases.length} test(s) passed.`);
