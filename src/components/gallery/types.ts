export type FacetValue = { v: string; l: string; n: number };

export type Facet = {
  key: string;
  label: string;
  primary?: boolean;
  values: FacetValue[];
};

export type GalleryItem = {
  id: string;
  /** Pose grouping key; only present in the pose dataset. */
  g?: string;
  /** Camera angle of this row; only present in the pose dataset. */
  a?: string;
  /** One value per facet, in the same order as `data.facets`. */
  f: string[];
  /** Headline shown on the card. */
  n: string;
  /** Small secondary line (id / category / hair length …). */
  d: string;
  /** Thumbnail path relative to /sites/<slug>-gallery/. */
  t: string;
  /** Remote thumbnail URL, used when the local mirror is missing. */
  tu: string;
  /** Absolute URL of the full-size image on the source site. */
  u: string;
  w: number;
  h: number;
};

export type GalleryData = {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  unit: string;
  search: string;
  /** CSS aspect-ratio for the card image box, e.g. "3/4". */
  ratio?: string;
  /** Pose-only: how rows collapse into one card per pose. */
  group?: { by: string; angle: string; order: string[] };
  facets: Facet[];
  items: GalleryItem[];
};
