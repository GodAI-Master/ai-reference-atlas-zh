// Builds the normalised dataset for the pose gallery from the Chinese mirror's
// data/pose-zh.json (already translated upstream — no JA→ZH work needed here).
//
//   node docs/research/galleries/build-pose.mjs <path to pose-zh.json> <repo root>

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
const ROOT = process.argv[3] || process.cwd();
const SITE = "https://ai-pose-gallery.anhao.app/";

const rows = JSON.parse(readFileSync(SRC, "utf8"));

const items = rows.map((r) => ({
  id: r.id,
  f: [r["体系"], r["分类"], r["角度"]],
  n: r["姿势名称"],
  d: `${r["姿势编号"]} · ${r["分类"]}`,
  t: `thumbs/${r.id}.jpg`,
  tu: SITE + r["缩略图"],
  u: SITE + r["原图"],
  w: 300,
  h: 400,
}));

const count = (idx) => {
  const m = new Map();
  for (const it of items) m.set(it.f[idx], (m.get(it.f[idx]) || 0) + 1);
  return [...m.entries()];
};

// 体系 order as published; 分类 sorted by size for a usable chip wall.
const sizes = count(1).sort((a, b) => b[1] - a[1]);

const data = {
  slug: "pose",
  eyebrow: "POSE-01 ・ 人体姿势参考",
  title: "姿势库",
  subtitle:
    "288 组人体姿势、1439 张多角度参考图，可按体系、动作分类与视角筛选。同一姿势的多个视角连用，更容易让生成的图片或视频保持姿态一致。",
  unit: "张",
  search: "搜索姿势名、编号或分类",
  facets: [
    {
      key: "system",
      label: "体系",
      primary: true,
      values: count(0).map(([v, n]) => ({ v, l: v, n })),
    },
    { key: "cat", label: "分类", values: sizes.map(([v, n]) => ({ v, l: v, n })) },
    {
      key: "angle",
      label: "视角",
      values: ["正面", "斜侧", "侧面", "俯视", "仰视"]
        .map((v) => ({ v, l: v, n: items.filter((it) => it.f[2] === v).length })),
    },
  ],
  items,
};

const out = join(ROOT, "src/data/galleries/pose.json");
writeFileSync(out, JSON.stringify(data));
console.log(`pose: ${items.length} items -> ${out}`);
console.log("facets:", data.facets.map((f) => `${f.label}(${f.values.length})`).join(", "));
