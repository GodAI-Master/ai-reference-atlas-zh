// Builds the "depth" gallery dataset from ai-pose-depth-gallery.pages.dev.
//
//   node docs/research/galleries/build-depth.mjs <depth.html> <pose-zh.json> <repo root>
//
// The depth site ships the same 1439 poses as the pose library, rendered as
// grayscale depth maps. Its records are Japanese, but the ids are identical to
// the Chinese pose dataset, so every label is taken from there by id — no
// translation table is needed and the wording stays consistent with /pose.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , HTML, POSE_ZH, ROOT = process.cwd()] = process.argv;
const SITE = "https://ai-pose-depth-gallery.pages.dev/";

/* Same policy as the pose library (see build-pose.mjs): couple poses and the
   explicit systems / categories are excluded so the site can stay public. */
const DROP_SYSTEMS = new Set(["双人缠绵", "全身单人・性感系"]);
const DROP_CATEGORIES = new Set(["性感・大胆系", "挤胸・强调事业线系"]);

const html = readFileSync(HTML, "utf8");
const grab = (name) => {
  const i = html.indexOf(`const ${name}=`);
  const start = html.indexOf("=", i) + 1;
  let depth = 0;
  let j = start;
  for (; j < html.length; j++) {
    const ch = html[j];
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) {
        j++;
        break;
      }
    }
  }
  return html.slice(start, j);
};

const raw = JSON.parse(grab("D"));

// id -> Chinese labels from the already-translated pose dataset
const zh = new Map(
  JSON.parse(readFileSync(POSE_ZH, "utf8")).map((r) => [r.id, r])
);

const ANGLE_ORDER = ["正面", "俯视", "仰视", "侧面", "斜侧"];
const missing = [];

const mapped = [];
for (const r of raw) {
  const cn = zh.get(r.id);
  if (!cn) {
    missing.push(r.id);
    continue;
  }
  mapped.push({
    id: r.id,
    g: r.id.replace(/_[^_]+$/, ""),
    a: cn["角度"],
    f: [cn["体系"], cn["分类"], cn["角度"]],
    n: cn["姿势名称"],
    d: `${cn["姿势编号"]} · ${cn["分类"]}`,
    t: `thumbs/${r.id}.jpg`,
    tu: SITE + r["サムネ"],
    u: SITE + r["原寸"],
    w: 300,
    h: 400,
  });
}

const kept = mapped.filter(
  (it) => !DROP_SYSTEMS.has(it.f[0]) && !DROP_CATEGORIES.has(it.f[1])
);

// Keep poses in source order, angles in the published order.
const groupOrder = [...new Set(mapped.map((it) => it.g))];
const rank = (a) => (ANGLE_ORDER.indexOf(a) === -1 ? 99 : ANGLE_ORDER.indexOf(a));
kept.sort(
  (x, y) =>
    groupOrder.indexOf(x.g) - groupOrder.indexOf(y.g) || rank(x.a) - rank(y.a)
);

const countFacet = (idx) => {
  const m = new Map();
  for (const it of kept) m.set(it.f[idx], (m.get(it.f[idx]) || 0) + 1);
  return [...m.entries()];
};

const groupCount = new Set(kept.map((it) => it.g)).size;

const data = {
  slug: "depth",
  eyebrow: "DEPTH-02 ・ 深度图姿势参考",
  title: "深度姿势库",
  subtitle: `${groupCount} 组人体姿势、${kept.length} 张深度图。与姿势库同一套姿势，但输出为灰度深度图（纯黑背景），适合 ControlNet 深度等需要三维信息的场景；同样可按姿势切换多视角。`,
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
    {
      key: "cat",
      label: "分类",
      values: countFacet(1).sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, l: v, n })),
    },
    {
      key: "angle",
      label: "视角",
      values: ANGLE_ORDER.map((v) => ({
        v,
        l: v,
        n: kept.filter((it) => it.f[2] === v).length,
      })),
    },
  ],
  items: kept,
};

const out = join(ROOT, "src/data/galleries/depth.json");
writeFileSync(out, JSON.stringify(data));
console.log(`depth: ${raw.length} rows -> ${kept.length} kept / ${groupCount} poses`);
if (missing.length) console.log("未匹配到中文标签:", missing.length, missing.slice(0, 5));
console.log("facets:", data.facets.map((f) => `${f.label}(${f.values.length})`).join(", "));
