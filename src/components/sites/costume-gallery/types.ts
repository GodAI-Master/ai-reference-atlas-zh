export type Costume = {
  id: string;
  カテゴリ: string;
  キーワード: string;
  サムネ: string;
  画像: string;
  原寸: string;
};

export type GalleryMeta = {
  total: number;
  cats: string[];
  counts: Record<string, number>;
};
