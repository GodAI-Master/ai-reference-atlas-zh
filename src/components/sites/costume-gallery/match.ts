import { JA } from "./keywords";
import { EN_BY_ZH, categoryZh, tokenZh } from "./zh";
import type { Costume } from "./types";

/**
 * Search predicate derived from the source `hit()`, extended for Chinese.
 *
 * Source behaviour kept as-is: the ID and category are matched against the raw
 * query word, and keywords are matched with `startsWith` against a translation
 * (Japanese synonyms originally). Added for the Chinese build: the translated
 * category label, the Chinese keyword text, and a Chinese→English token lookup.
 */
export function hit(d: Costume, cat: string, q: string): boolean {
  if (cat && d.カテゴリ !== cat) return false;
  if (!q) return true;

  const id = d.id.toLowerCase();
  const tokens = d.キーワード.split(" ");
  const cnTokens = tokens.map(tokenZh);
  const cnCategory = categoryZh(d.カテゴリ);

  return q.split(/\s+/).every((w) => {
    const translated = EN_BY_ZH[w] || JA[w] || w;
    return (
      id.includes(w) ||
      d.カテゴリ.includes(w) ||
      cnCategory.includes(w) ||
      tokens.some((t) => t.startsWith(translated)) ||
      cnTokens.some((t) => t.includes(w))
    );
  });
}

export const fmt = (n: number) => n.toLocaleString("zh-CN");
