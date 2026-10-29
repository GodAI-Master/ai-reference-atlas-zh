# Page brief — ai-costume-gallery.pages.dev

## Route map

| Source | Local | Owner |
| --- | --- | --- |
| `https://ai-costume-gallery.pages.dev/` | `/` | `src/app/page.tsx` → `src/components/sites/costume-gallery/*` |

Single-page app. No secondary routes, no client-side routing.

## What it is

`衣装集 COSTUME-DB-01` — a costume reference gallery for AI image generation. Costume-only
imagery (no people), 2:3 aspect. 1407 records, 8 categories, fully client-side filter/search/
pagination/lightbox.

Source stack: hand-written static HTML + one inline `<style>` + one inline `<script>`.
No framework, no web fonts, no external CSS/JS beyond a Cloudflare beacon.

## Data shape (`src/data/costumes.json`, 1407 records)

```json
{ "id": "SPR-0001", "カテゴリ": "春", "キーワード": "ivory frill knit denim mini skirt coat socks white sneakers",
  "サムネ": "thumbs/SPR-0001.webp", "画像": "img/SPR-0001.webp", "原寸": "png/SPR-0001.png" }
```

Category counts (order comes from `META.cats`, preserved as-is):
春 215 · 夏 254 · 秋 244 · 冬 253 · ランジェリー 199 · パーティ 48 · 水着 54 · セクシー 140 = 1407

## Layout

- `max-width: 1600px` content column, side padding `clamp(16px, 4vw, 48px)`.
- Header: eyebrow (uppercase, letter-spacing .22em), gradient-text `h1`, sub line, CTA block.
- Sticky toolbar (`top:0`, `backdrop-filter: blur(14px)`, `rgba(13,15,18,.82)`):
  category pills (52px tall, `border-radius:99px`), then search + count row.
- Grid: `repeat(auto-fill, minmax(240px, 1fr))`, gap 18px; 2 columns under 560px (gap 10px).
- Card: panel bg `#1a1e24`, 1px `#272c34` border, radius 14px; image well `aspect-ratio:2/3`
  on `#e9e9e7`; meta row = ID (mono 12px) + category, then keyword line-clamped to 3 lines.
- Hover/focus: `translateY(-4px)` + `0 10px 30px rgba(0,0,0,.45)`.
- Modal: `min(1200px,100%)`, grid `1fr 300px`, image well `min(78vh,900px)` on `#e9e9e7`,
  side panel with ID, カテゴリ, PNG download button, keyboard hints.

## Design tokens

```
--bg #0d0f12  --bg2 #14171c  --panel #1a1e24  --line #272c34  --line2 #343a44
--tx #e9ecf1  --tx2 #a3abb8  --tx3 #6c7482  --ac #8fb4ff  --ac2 #c3d5ff
--r 14px  --sh 0 10px 30px rgba(0,0,0,.45)
```

Body background is three stacked radial gradients over `--bg`:
`1200x500 at 15% -10% #1b2433`, `900x400 at 100% 0 #211a2b`, then flat `--bg`.
Font stack is system CJK (`system-ui`, Hiragino Sans, Noto Sans CJK JP, Yu Gothic UI, Meiryo) —
no webfont requests.

## Behaviour inventory (all reproduced)

1. **Category tabs** — `すべて` + 8 categories with counts; `aria-selected`; clicking resets
   pagination to 120 and scrolls to the toolbar's `offsetTop`.
2. **Search** — 150 ms debounce, lowercased, trimmed. Multi-word AND. Japanese→English synonym
   table (~110 entries: 黒→black, ワンピース→dress, レース→lace …). Per word: `id.includes(w)`
   OR `category.includes(w)` OR any keyword token `startsWith(translated)`. So `白` finds whites
   but `whi` also did — prefix matching is intentional.
3. **Pagination** — 120 per batch, "もっと見る（残りN枚）" button + `IntersectionObserver`
   (`rootMargin: 800px`) auto-appends.
4. **Lightbox** — opens on card click or Enter; progressive image upgrade (thumb → 画像 on load);
   ←/→ step (appending more rows when stepping past the rendered window), Esc closes,
   backdrop click closes, focus returns to the originating card, `body.overflow` locked,
   touch swipe >40px steps.
5. **Header info tabs** — two popovers (使い方のヒント / 注意点); toggling, Esc, outside
   `pointerdown` with click-swallow so the dismiss click doesn't open a card underneath,
   vertical reposition under 560px, close on scroll (mobile) and on resize.

## Assets

| Tier | Source path | Local | Notes |
| --- | --- | --- | --- |
| Thumb | `thumbs/<ID>.webp` | `public/sites/costume-gallery/thumbs/` | **all 1407 mirrored**, ~14 MB, ~270x405 px each |
| Display | `img/<ID>.webp` | — (not mirrored) | 1366x2048, ~93 KB avg, still fetched from origin |
| Original | `png/<ID>.png` | — (not mirrored) | multi-MB each |

## Verification

Both pages were driven through the same CDP script (`cdp-drive.mjs`, no dependencies — it
spawns headless Edge and speaks the DevTools protocol) at 1440x1000:

| Step | Source | Clone |
| --- | --- | --- |
| Initial cards / count | 120 / `1,407枚を表示` | identical |
| `もっと見る` click | 120 → 240 cards, `残り1,167枚`, page height 24787 | identical |
| Tab labels | 9 tabs, counts 215/254/244/253/199/48/54/140 | identical |
| Click 夏 | `254枚を表示`, first `SUM-0162` | identical |
| Search `白` in 夏 | `136枚を表示` | identical |
| No match (`zzzznope`) | `0枚を表示`, empty state shown | identical |
| Open card | modal `flex`, title `SUM-0162`, cat `夏`, body locked | identical |
| Arrow right | `SUM-0163` | identical |
| Escape | modal closed, focus back on `.card` | identical |
| Info tab | `aria-expanded=true`, panel `block`, 4 items | identical |
| Console errors | none | none |

A JSON diff of the two runs reported **2 differences**, both asset URL schemes:
`dlHref` (`png/SUM-0162.png` → `/api/costume-png/SUM-0162`) and
`imgSrc` (`thumbs/...` → `/sites/costume-gallery/thumbs/...`).

Screenshots: `docs/design-references/costume-gallery/`
(`src-*` = source, `prod-*` = clone) at 1440 wide and 390 wide, plus scroll position 1500.
Header geometry, grid rhythm, sticky toolbar, mobile stacking and the lightbox all match.

## Localisation (zh-CN)

The build ships in Simplified Chinese. Data is untouched — filtering still keys off the original
Japanese `カテゴリ` values and the English keyword tokens; translation happens at render time in
`src/components/sites/costume-gallery/zh.ts`:

- `CATEGORY_ZH` — 春/夏/秋/冬/内衣/派对/泳装/性感
- `TOKEN_ZH` — all **86** distinct English keyword tokens → Chinese (吊带, 蕾丝, 牛仔, 百褶 …)
- `EN_BY_ZH` — reverse index so a Chinese query maps back to the English token
- `tokenZh()` / `categoryZh()` — render-time lookups with pass-through fallback

Translated surfaces: header (eyebrow, h1, subtitle), info popovers, both CTA blocks, category
tabs, search placeholder, result count (`显示 N 张`), empty state, load-more button
(`加载更多（剩余 N 张）`), lightbox labels and keyboard hints, all `aria-label`s, and page
metadata. `html lang` is `zh-CN`; the CSS `--f` stack is reordered Chinese-first
(PingFang SC → Hiragino Sans GB → Microsoft YaHei → Noto Sans SC) instead of the source's
Japanese-first order.

**Search behaviour change (intentional).** `hit()` keeps the source's rules and adds two:
the translated category label, and the Chinese keyword text (`cnTokens.includes(w)`). Consequence:
a single character now matches every Chinese term containing it — `白` in 夏 returns 145 instead of
the source's 136, because 象牙白 (ivory) now matches alongside 白色 (white). English and Japanese
queries still work unchanged (`denim`, `白`, `ワンピース`). Verified: `蕾丝` → 346 张 (equal to the
token's total occurrence count), `蕾丝 黑色` → 94 张.

### Info panels re-sourced (verbatim)

The 使用提示 / 注意事项 copy is no longer the original costume site's — it is reproduced verbatim
from `https://ai-pose-gallery.anhao.app/` (its `INFO.guide` / `INFO.notice` payload), per request:
使用指南 5 items, 注意事项 5 items plus its closing `.info-note` paragraph. Tabs are relabelled
使用指南 / 注意事项; `<strong>` emphasis and the note block are rendered as separate React nodes.

**Carried-over wording that describes the pose site, not this one** — left verbatim on request:
`姿势参考 / 构图参考`, `900 × 1200 原尺寸 PNG`, `← / → 切换角度，↑ / ↓ 切换姿势`,
`灰色人体素体线稿`. See "Remaining gaps".

### Promo / contact blocks removed

Both CTA blocks are gone — the one in the header and the identical footer repeat. `CtaBlock.tsx`
was deleted; no `开放聊天群`, `x.gd/9BOJA` or `x.com/giaaibusi` reference remains in `src/`. The
source's `.cta` rules stay in the stylesheet (CSS is kept verbatim) but nothing renders them.

### Guide copy adapted to this site

Four lines plus one related line were rewritten so the guide matches a costume gallery rather than
the pose library it came from:

| Was (pose site) | Now (this site) |
| --- | --- |
| 姿势参考 / 构图参考 | 服装参考 / 图像参考 |
| 同一姿势连续使用多个视角…姿态一致 | 同一套服装搭配多张参考图…服装一致 |
| 900 × 1200 原尺寸 PNG | 1366 × 2048 原尺寸 PNG (verified from the PNG IHDR) |
| 无五官的灰色人体素体线稿，不包含面部、服装与背景 | 纯服装图像，不包含人物、面部与背景 |
| ← / → 切换角度，↑ / ↓ 切换姿势 | ← / → 切换上一张 / 下一张 |

注意事项 was also brought in line, two phrases only:

| Was (pose site) | Now (this site) |
| --- | --- |
| 包括商业作品、编辑加工与姿势参考 | 包括商业作品、编辑加工与服装参考 |
| 图中为人体素体线稿，并非真实人物 | 图中为 AI 生成的虚构服装，并非真实商品 |

Everything else in both panels — the remaining 注意事项 bullets and the closing `.info-note` —
still reproduces the reference site word for word.


## Known gaps

- `img/*.webp` and `png/*.png` are **not** mirrored. The origin throttles to ~10 KB/s per
  sequential fetch (measured: 5 display images = 420 KB in 42.6 s), so 1407 display images
  (~131 MB) would take hours and the PNG set is multi-GB. Consequences:
  - The lightbox opens on the local thumbnail and upgrades to the absolute source `画像` URL
    once it decodes (verified: 1366x2048, rendered 520x780 — same as source). Until that
    request lands, the image renders at thumbnail size; offline, it stays at thumbnail size.
  - The download button streams the PNG through `/api/costume-png/[id]` so the `download`
    attribute still works (browsers ignore it cross-origin). It is as slow as the origin.
  - To make it fully local later, mirror the display tier with the bundled downloader:
    `node docs/research/costume-gallery/download-assets.js docs/research/costume-gallery/imgs.txt <abs path to public/sites/costume-gallery>`.
- No Cloudflare analytics beacon (owner-specific).

## Template deviations

- `src/app/layout.tsx` drops the Geist webfonts (the source uses a system CJK stack and makes
  no font requests) and sets `lang="zh-CN"`.
- `src/app/costume-gallery.css` appends to the otherwise verbatim source CSS: a Chinese-first
  `--f` stack, `line-height:normal` on `html,body` (the template's Tailwind base sets `1.5`,
  which shifted every text block by up to 14 px), a dark-canvas guard, and a missing-thumb
  placeholder.
- `eslint.config.mjs` ignores `docs/**` (source snapshots and one-off tooling live there).

