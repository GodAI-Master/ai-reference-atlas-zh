// Builds the normalised dataset for the pose gallery from the Chinese mirror's
// data/pose-zh.json (already translated upstream — no JA→ZH work needed here).
//
//   node docs/research/galleries/build-pose.mjs <path to pose-zh.json> <repo root>
//
// 1439 records collapse into 288 poses; each pose carries 4–5 camera angles,
// which is what the lightbox's angle strip and ←/→ navigation work on.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
const ROOT = process.argv[3] || process.cwd();
const SITE = "https://ai-pose-gallery.anhao.app/";

// Order used by the source's angle strip and by ←/→ cycling.
const ANGLE_ORDER = ["正面", "俯视", "仰视", "侧面", "斜侧"];

const rows = JSON.parse(readFileSync(SRC, "utf8"));

const groupOf = (id) => id.replace(/_[^_]+$/, "");
const angleRank = (a) => {
  const i = ANGLE_ORDER.indexOf(a);
  return i === -1 ? 99 : i;
};

// Keep the source order of poses, and the fixed order of angles within a pose.
const groups = new Map();
for (const r of rows) {
  const key = groupOf(r.id);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}
for (const list of groups.values()) list.sort((a, b) => angleRank(a["角度"]) - angleRank(b["角度"]));

const items = [];
for (const list of groups.values()) {
  for (const r of list) {
    items.push({
      id: r.id,
      g: groupOf(r.id),
      a: r["角度"],
      f: [r["体系"], r["分类"], r["角度"]],
      n: r["姿势名称"],
      d: `${r["姿势编号"]} · ${r["分类"]}`,
      t: `thumbs/${r.id}.jpg`,
      tu: SITE + r["缩略图"],
      u: SITE + r["原图"],
      w: 300,
      h: 400,
    });
  }
}

const countFacet = (idx) => {
  const m = new Map();
  for (const it of items) m.set(it.f[idx], (m.get(it.f[idx]) || 0) + 1);
  return [...m.entries()];
};

const sizes = countFacet(1).sort((a, b) => b[1] - a[1]);

const data = {
  slug: "pose",
  eyebrow: "POSE-01 ・ 人体姿势参考",
  title: "姿势库",
  subtitle:
    "288 组人体姿势、1439 张多角度参考图。可切「按姿势」查看同一姿势的 5 个视角，也可「逐张」浏览；同一姿势多视角连用更容易保持姿态一致。",
  unit: "张",
  search: "搜索姿势名、编号或分类",
  ratio: "3/4",
  group: { by: "g", angle: "a", order: ANGLE_ORDER },
  facets: [
    {
      key: "system",
      label: "体系",
      primary: true,
      values: countFacet(0).map(([v, n]) => ({ v, l: v, n })),
    },
    { key: "cat", label: "分类", values: sizes.map(([v, n]) => ({ v, l: v, n })) },
    {
      key: "angle",
      label: "视角",
      values: ANGLE_ORDER.map((v) => ({
        v,
        l: v,
        n: items.filter((it) => it.f[2] === v).length,
      })),
    },
  ],
  items,
};

const out = join(ROOT, "src/data/galleries/pose.json");
writeFileSync(out, JSON.stringify(data));
console.log(`pose: ${items.length} items / ${groups.size} poses -> ${out}`);
console.log("facets:", data.facets.map((f) => `${f.label}(${f.values.length})`).join(", "));
