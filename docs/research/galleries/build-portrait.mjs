// Builds the normalised dataset for the portrait gallery from the source
// `data/images.js` payload (window.GALLERY_IMAGES).
//
//   node docs/research/galleries/build-portrait.mjs <path to images.js> <repo root>
//
// Output: src/data/galleries/portrait.json — items already carry Chinese labels,
// so the runtime needs no translation tables.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
const ROOT = process.argv[3] || process.cwd();

const SECTION_ZH = { face: "面部特写", styling: "造型参考" };
const HAIR_ZH = {
  ショート: "短发",
  ミディアム: "中发",
  セミロング: "中长发",
  ロング: "长发",
};

const STYLE_ZH = {
  "くびれショート（襟足長め・シースルーバング）": "收腰短发（后颈偏长·空气刘海）",
  "ウェットヘアの前髪長めショートボブ": "湿发感长刘海短波波头",
  "ショートウルフ（ミニウルフ）": "短狼尾（迷你狼尾）",
  "スパイラルパーマショートボブ（黒髪）": "螺旋烫短波波头（黑发）",
  "ハイトーンミルクティーショートボブ": "高明度奶茶色短波波头",
  "ハイライト入り丸みショート": "挑染圆润短发",
  "マッシュショート（前髪長め）": "蘑菇短发（长刘海）",
  "ミニボブパーマ（くせ毛風）": "迷你波波烫（自然卷风）",
  "ミニボブ（オン眉ぱっつん前髪）": "迷你波波头（齐眉齐刘海）",
  "レイヤーショートボブ（顔まわりレイヤー）": "层次短波波头（脸周层次）",
  "丸みショートボブ（シースルーバング・ダークブラウン）": "圆润短波波头（空气刘海·深棕）",
  "内巻きワンカールボブ（ラベンダーアッシュ）": "内扣单卷波波头（薰衣草灰）",
  "切りっぱなしストレートボブ（前髪なし）": "齐切直发波波头（无刘海）",
  "前下がりひし形ショートボブ（黒髪）": "前长后短菱型短波波头（黑发）",
  "外ハネボブ（暗髪）": "外翘波波头（暗发色）",
  "耳掛けハンサムショート（前髪なし）": "耳后帅气短发（无刘海）",
  "韓国風タッセルボブ（サイドバング）": "韩式流苏波波头（侧刘海）",
  "2wayバングのワンカールミディアムボブ": "双分刘海单卷中长波波头",
  "くびれボブ（インナーカラー）": "收腰波波头（内层染）",
  "くるくるハードパーマミディアム": "卷卷硬烫中长发",
  "ぱっつん前髪のミディアムストレート": "齐刘海中长直发",
  "ハイトーンミルクティーグレージュミディアム": "高明度奶茶灰中长发",
  "ハッシュカット（韓国ヘア）": "层次碎剪（韩式）",
  "バタフライカット（ヘーゼルカラー）": "蝴蝶剪（榛果色）",
  "バーガンディのシースルーレイヤー": "酒红空气层次",
  "ミディアムウルフパーマ": "中长狼尾烫",
  "ミディアムニュアンスパーマ（コテ巻き風）": "中长氛围烫（电棒卷风）",
  "ミディアムレイヤー内巻きワンカール（まろベージュ）": "中长层次内扣单卷（柔米色）",
  "ロブレイヤー（ミントベージュ）": "长波波层次（薄荷米色）",
  "切りっぱなし外ハネミディアムボブ": "齐切外翘中长波波头",
  "前下がりミディアムボブ（マロンベージュ）": "前长后短中长波波头（栗米色）",
  "艶さらストレートミディアムボブ（前髪なし）": "顺滑直发中长波波头（无刘海）",
  "重めミディアムレイヤー（バレイヤージュ）": "厚重中长层次（渐变挑染）",
  "鎖骨丈ミディアムレイヤーボブ（アッシュグレージュ）": "锁骨长中长层次波波头（灰米色）",
  "2wayバングの韓国レイヤー": "双分刘海韩式层次",
  "くびれセミロング（透明感カラー）": "收腰中长发（通透感发色）",
  "たっぷりレイヤー（ラベンダーグレージュ）": "丰厚层次（薰衣草灰米）",
  "シースルーぱっつん前髪のシャギーレイヤー": "空气齐刘海碎层次",
  "スパイラルパーマ韓国風セミロング": "螺旋烫韩式中长发",
  "セミロングウルフ（チェリーレッド）": "中长狼尾（樱桃红）",
  "セミロングストレート（前髪あり・暗髪）": "中长直发（有刘海·暗发色）",
  "セミロングニュアンスパーマ": "中长氛围烫",
  "セミロング顔まわりレイヤー（ミルクティーベージュ）": "中长脸周层次（奶茶米色）",
  "セミロング黒髪ツヤレイヤー": "中长黑发亮泽层次",
  "ハイレイヤー×裾カラー（ブロンド）": "高层次×发尾染（金发）",
  "ハッシュカット（グレージュ）": "层次碎剪（灰米色）",
  "バタフライカット（ミントベージュ・シースルーバング）": "蝴蝶剪（薄荷米色·空气刘海）",
  "ロングウルフ（クラゲヘア）": "长狼尾（水母头）",
  "ワンカールレイヤーと後れ毛（ショコラブラウン）": "单卷层次与碎发（巧克力棕）",
  "斜めバングのエアリーカール": "斜刘海空气卷",
};

const raw = readFileSync(SRC, "utf8")
  .replace(/^\s*window\.GALLERY_IMAGES\s*=\s*/, "")
  .replace(/;\s*$/, "");
const rows = JSON.parse(raw);

const SITE = "https://ai-portrait-gallery.pages.dev/";
const missing = new Set();

const items = rows.map((r) => {
  const section = SECTION_ZH[r.section] || r.section;
  const hair = HAIR_ZH[r.hair] || r.hair;
  let name = r.style ? STYLE_ZH[r.style] : "";
  if (r.style && !name) missing.add(r.style);
  if (!name) name = section;
  return {
    id: r.id,
    f: [section, hair],
    n: name,
    d: hair,
    t: `thumbs/${r.id}.webp`,
    tu: SITE + r.thumb,
    u: SITE + r.full,
    w: r.thumb_w,
    h: r.thumb_h,
  };
});

const count = (idx) => {
  const m = new Map();
  for (const it of items) m.set(it.f[idx], (m.get(it.f[idx]) || 0) + 1);
  return [...m.entries()];
};

const data = {
  slug: "portrait",
  eyebrow: "PORTRAIT-01 ・ AI 人像参考",
  title: "人脸库",
  subtitle:
    "AI 生成的虚构人像参考图，共 1499 张。面部特写用于锁定五官，造型参考涵盖发型与整体气质，可作角色一致性的人脸参照。",
  unit: "张",
  ratio: "4/5",
  search: "搜索编号或发型关键词",
  facets: [
    {
      key: "section",
      label: "类型",
      primary: true,
      values: count(0).map(([v, n]) => ({ v, l: v, n })),
    },
    {
      key: "hair",
      label: "发型",
      values: count(1).map(([v, n]) => ({ v, l: v, n })),
    },
  ],
  items,
};

const out = join(ROOT, "src/data/galleries/portrait.json");
writeFileSync(out, JSON.stringify(data));
console.log(`portrait: ${items.length} items -> ${out}`);
console.log("facets:", data.facets.map((f) => `${f.label}(${f.values.length})`).join(", "));
if (missing.size) console.log("未翻译的 style:", [...missing].join(" | "));
