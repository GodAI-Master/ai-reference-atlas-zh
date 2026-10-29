/**
 * Chinese localisation tables.
 *
 * The dataset keeps its original Japanese field values (`カテゴリ`) and English
 * keywords because they are the filter keys; everything shown to the reader is
 * translated here at render time.
 */

/** Category key (as stored in costumes.json) -> Chinese label. */
export const CATEGORY_ZH: Record<string, string> = {
  春: "春",
  夏: "夏",
  秋: "秋",
  冬: "冬",
  ランジェリー: "内衣",
  パーティ: "派对",
  水着: "泳装",
  セクシー: "性感",
};

/** English keyword token -> Chinese label. Covers the full 86-token vocabulary. */
export const TOKEN_ZH: Record<string, string> = {
  bag: "包包",
  mini: "迷你",
  black: "黑色",
  skirt: "半身裙",
  knit: "针织",
  dress: "连衣裙",
  boots: "靴子",
  socks: "袜子",
  lace: "蕾丝",
  white: "白色",
  ribbon: "蝴蝶结",
  sandals: "凉鞋",
  leather: "皮革",
  stockings: "长筒袜",
  brown: "棕色",
  camisole: "吊带",
  tights: "连裤袜",
  cardigan: "开衫",
  necklace: "项链",
  ivory: "象牙白",
  satin: "缎面",
  pants: "长裤",
  jacket: "夹克",
  heels: "高跟鞋",
  shorts: "短裤",
  beige: "米色",
  grey: "灰色",
  denim: "牛仔",
  pleated: "百褶",
  red: "红色",
  gold: "金色",
  blue: "蓝色",
  shirt: "衬衫",
  fur: "毛皮",
  navy: "藏青",
  silver: "银色",
  frill: "荷叶边",
  choker: "颈链",
  midi: "中长",
  coat: "大衣",
  bra: "胸罩",
  briefs: "内裤",
  pink: "粉色",
  sneakers: "运动鞋",
  suede: "麂皮",
  green: "绿色",
  blouse: "女衬衫",
  tote: "托特包",
  loafers: "乐福鞋",
  belt: "腰带",
  mint: "薄荷绿",
  hat: "帽子",
  jeans: "牛仔裤",
  wool: "羊毛",
  cream: "奶油色",
  headband: "发箍",
  floral: "碎花",
  corset: "束身衣",
  velvet: "天鹅绒",
  pumps: "单鞋",
  gloves: "手套",
  turtleneck: "高领",
  sunglasses: "墨镜",
  yellow: "黄色",
  khaki: "卡其",
  burgundy: "酒红",
  orange: "橙色",
  corduroy: "灯芯绒",
  scarf: "围巾",
  robe: "长袍",
  swimsuit: "泳装",
  sweater: "毛衣",
  chiffon: "雪纺",
  olive: "橄榄绿",
  tulle: "薄纱",
  mesh: "网纱",
  beret: "贝雷帽",
  vest: "马甲",
  hoodie: "连帽衫",
  apron: "围裙",
  maxi: "长款",
  "polka-dot": "波点",
  lavender: "薰衣草紫",
  beanie: "针织帽",
  muffler: "厚围巾",
  purple: "紫色",
};

/**
 * Reverse index for search: Chinese word -> the English token it should match.
 * Several Chinese words can point at the same token.
 */
export const EN_BY_ZH: Record<string, string> = Object.entries(TOKEN_ZH).reduce(
  (acc, [en, zh]) => {
    acc[zh] = en;
    return acc;
  },
  {} as Record<string, string>
);

/** Translate one keyword token; unknown tokens fall through unchanged. */
export const tokenZh = (token: string) => TOKEN_ZH[token] ?? token;

/** Chinese label for a category key. */
export const categoryZh = (key: string) => CATEGORY_ZH[key] ?? key;
