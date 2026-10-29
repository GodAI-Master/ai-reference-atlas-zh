/**
 * Asset locations.
 *
 * Only the thumbnail tier (`thumbs/<ID>.webp`, ~7.5 KB each) is mirrored into
 * `public/`. The display tier (`img/<ID>.webp`, ~93 KB) and the originals
 * (`png/<ID>.png`, multi-MB) stay on the source origin: the link to that origin
 * throttles to a few KB/s, so mirroring 1407 display images (~131 MB) and the
 * PNG set (multi-GB) was not practical. See docs/research/costume-gallery/brief.md.
 */
export const SOURCE_ORIGIN = "https://ai-costume-gallery.pages.dev/";
export const ASSET_BASE = "/sites/costume-gallery/";

/** Rows appended per "もっと見る" batch. */
export const PAGE_SIZE = 120;

/** Mirrored thumbnail, served from `public/sites/costume-gallery/`. */
export const thumbUrl = (rel: string) => ASSET_BASE + rel;

/** Larger display image, still on the source origin. */
export const displayUrl = (rel: string) => SOURCE_ORIGIN + rel;

/**
 * Original PNG. Routed through the local API so the `download` attribute is
 * honoured (browsers ignore it for cross-origin URLs) and the source does not
 * get hot-linked from the UI.
 */
export const pngHref = (id: string) => `/api/costume-png/${id}`;
