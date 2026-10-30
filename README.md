# AI 参考集合 · 人脸 / 姿势 / 服装

> 把三个 AI 参考图库整合进一个站：人脸库 1499 张、姿势库 1439 张、服装库 1407 张，全部中文化，一套导航、一套筛选逻辑。

![画廊预览](docs/design-references/costume-gallery/live-y0.png)

<details><summary>手机端预览</summary>

![手机端预览](docs/design-references/costume-gallery/zh-m-y0.png)

</details>

**在线演示：** <https://ai-costume-gallery.site/>　（备用：<https://ai-costume-gallery.de5.net/>）
**原始站点：** <https://ai-costume-gallery.pages.dev/>
**原作者：** ギア（[@giaaibusi](https://x.com/giaaibusi)）
**中文版维护：** GodAI · <https://github.com/GodAI-Master>
**GitHub：** <https://github.com/GodAI-Master/ai-costume-gallery-zh>

---

## 三个板块

| 板块 | 路由 | 条数 | 维度 |
| --- | --- | ---: | --- |
| 人脸库 | `/portrait` | 1499 | 类型（面部特写 / 造型参考）× 发型（短发 / 中发 / 中长发 / 长发） |
| 姿势库 | `/pose` | 1439 | 体系（4）× 动作分类（26）× 视角（5） |
| 服装库 | `/costume` | 1407 | 分类（春 / 夏 / 秋 / 冬 / 内衣 / 派对 / 泳装 / 性感） |

首页 `/` 是三个板块的入口页，左侧固定导航贯穿全站。

## 这是什么

原站是一套面向 AI 绘画的服装参考图库（`衣装集 COSTUME-DB-01`），元数据为日文，单页静态 HTML，无框架、无构建流程。本仓库做了三件事：

1. **缩略图全量镜像** —— 1407 条记录对应的 1407 张缩略图（WEBP 约 270×405，共 14 MB）全部落地，页面不依赖源站即可浏览。
2. **完整汉化** —— 8 个分类、86 个英文关键词、全部界面文案逐条译为中文，并提供中文检索。
3. **可用的前端** —— 用 Next.js 16 + React 19 重写，完整实现原站的分类筛选、关键词搜索、分批加载、灯箱浏览与原图下载。

## 页面功能

- 8 个分类页签，显示各分类图片数
- ID / 关键词搜索，中英文均可（`蕾丝`、`牛仔`、`黑色`、`denim`、`lace`）
- 每批 120 张，点击「加载更多」或滚动到底自动追加
- 卡片点击进入灯箱，先显示缩略图、解码后再升级为展示图
- `← / →` 切换上一张 / 下一张，`Esc` 关闭，关闭后焦点回到原卡片；手机支持左右滑动
- 原图下载（PNG 1366×2048）经本地代理流式转发，保证 `download` 属性生效
- 使用指南 / 注意事项弹窗，支持键盘操作、点击外部关闭，且不会误触下方的卡片

## 数据规模

| 分类 | 条数 |
| --- | ---: |
| 春 | 215 |
| 夏 | 254 |
| 秋 | 244 |
| 冬 | 253 |
| 内衣 | 199 |
| 派对 | 48 |
| 泳装 | 54 |
| 性感 | 140 |
| **合计** | **1407** |

## 目录结构

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # lang=zh-CN、页面元数据
│   │   ├── page.tsx                        # 首页
│   │   ├── costume-gallery.css             # 原站样式逐条搬运 + 少量补充
│   │   └── api/costume-png/[id]/route.ts   # 原图下载代理
│   ├── components/sites/costume-gallery/
│   │   ├── CostumeGallery.tsx              # 网格 / 筛选 / 分页
│   │   ├── Lightbox.tsx                    # 灯箱
│   │   ├── InfoTabs.tsx                    # 使用指南 / 注意事项
│   │   ├── match.ts                        # 原站检索谓词 + 中文扩展
│   │   ├── keywords.ts                     # 日文→英文同义词表（104 条）
│   │   ├── zh.ts                           # 中文词表（分类 / 86 个关键词）
│   │   ├── source.ts                       # 素材路径
│   │   └── types.ts
│   └── data/
│       ├── costumes.json                   # 1407 条记录
│       └── meta.json                       # 分类与计数
├── public/sites/costume-gallery/thumbs/    # 1407 张缩略图
├── docs/
│   ├── research/costume-gallery/           # 源站快照、页面简报、下载脚本
│   └── design-references/costume-gallery/  # 源站 / 本地 / 线上对照截图
├── LICENSE
└── README.md
```

## 数据结构

`src/data/costumes.json` 字段与原站一致，字段名保持日文（它们是筛选键），中文只在渲染层替换：

| 字段 | 示例 | 说明 |
| --- | --- | --- |
| `id` | `SPR-0001` | 唯一标识，前缀对应分类 |
| `カテゴリ` | `春` | 8 个分类，中文显示名见 `zh.ts` |
| `キーワード` | `ivory frill knit denim …` | 英文关键词，界面按词表译成中文 |
| `サムネ` | `thumbs/SPR-0001.webp` | 缩略图，已本地化 |
| `画像` | `img/SPR-0001.webp` | 展示图 1366×2048，仍指向源站 |
| `原寸` | `png/SPR-0001.png` | 原图，经代理下载 |

中文检索由 `match.ts` 处理：保留原站的「ID 命中 / 分类命中 / 关键词前缀匹配」，并新增中文分类名与中文关键词的包含匹配，因此 `白` 会同时命中「白色」与「象牙白」。

## 本地预览

```bash
npm install
npm run dev          # http://localhost:3000
```

## 构建与检查

```bash
npm run check        # lint + typecheck + production build
```

## 部署到 Vercel

```bash
npx vercel deploy --prod
```

**自定义域名的坑（实测记录）**：接入前先确认根域是否在公共后缀列表（PSL）里。

- 在 PSL 内的免费二级域名服务（如 `de5.net`），Vercel 把 `xxx.de5.net` 视为独立域名，绑定直接 `verified: true`，只需一条 CNAME。
- 不在 PSL 的域名（如 `bbroot.com`）会被要求在其根域添加 `_vercel.<根域>` 的 TXT 记录；根域不在你手上时这条路走不通。

## 素材说明

| 层级 | 源站路径 | 本地 | 说明 |
| --- | --- | --- | --- |
| 缩略图 | `thumbs/<ID>.webp` | ✅ 全部镜像 | 约 7.5 KB / 张，共 14 MB |
| 展示图 | `img/<ID>.webp` | ❌ 仍指源站 | 1366×2048，约 93 KB / 张 |
| 原图 | `png/<ID>.png` | ❌ 仍指源站 | 1366×2048，约 1.1 MB / 张 |

展示图与原图未落地，原因是源站限速约 10 KB/s（实测 5 张展示图共 420 KB 耗时 42.6 秒），1407 张展示图约 131 MB、原图合计数 GB，不具备可行性。因此灯箱以本地缩略图打底，解码成功后再升级为源站展示图；原图下载经 `/api/costume-png/[id]` 流式转发。

如需完全本地化，可复用仓库内的下载器：

```bash
node docs/research/costume-gallery/download-assets.js \
  docs/research/costume-gallery/imgs.txt \
  <仓库绝对路径>/public/sites/costume-gallery
```

## 内容提示

图库为 AI 生成的虚构服装图像，不含人物面部与人体，亦非真实商品照片。分类名称涉及内衣、性感等题材，仅供艺术创作与前端技术学习使用，请勿用于违法用途。

## 版权与致谢

- **图片与原始数据的著作权归原作者 ギア（@giaaibusi）所有**，来源地址见页首。
- 本仓库仅为个人学习、汉化与前端工程实践存档，**不对图片主张任何权利**，也不构成对原作品的商业使用授权。
- 图片数据本身（含原始尺寸与加工后版本）的再分发、转载、转售由原作者禁止；如需商用请自行联系原作者。
- 若原作者认为本仓库侵犯其权益，请通过 [Issue](https://github.com/GodAI-Master/ai-costume-gallery-zh/issues) 联系，将立即删除相关内容。
- `LICENSE` 采用 MIT，**该协议只覆盖本仓库的代码**（`src/`、脚本与样式），**不覆盖** `public/sites/`、`src/data/` 中的图片与原始数据。
- 前端脚手架来自 [JCodesMore/ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template)（MIT），在此基础上完成站点重建与汉化。
- 使用指南与注意事项的文案体例参照 [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) 的中文版式，并按本站实际情况改写。
