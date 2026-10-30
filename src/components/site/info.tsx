import type { ReactNode } from "react";
import type { InfoTab } from "@/components/sites/costume-gallery/InfoTabs";

/**
 * 使用指南 / 注意事项 per library. Wording follows each source site's own
 * guide, so the costume panel talks about garments, the pose panel about
 * body line art and camera angles, the portrait panel about faces and CC0.
 */

export const COSTUME_INFO: InfoTab[] = [
  {
    label: "使用指南",
    heading: "使用指南",
    items: [
      <>
        将参考图导入各类 AI 工具的<strong>服装参考 / 图像参考</strong>功能。
      </>,
      <>同一套服装搭配多张参考图，更容易保持生成图片或视频中的服装一致。</>,
      <>
        点击卡片或缩略图进入大图，可下载 <strong>1366 × 2048 原尺寸 PNG</strong>，便于查看细节。
      </>,
      <>图片为纯服装图像，不包含人物、面部与背景，请通过提示词或其他参考图补充。</>,
      <>
        电脑端使用 <strong>← / →</strong> 切换上一张 / 下一张；手机端可左右滑动大图。
      </>,
    ],
  },
  {
    label: "注意事项",
    heading: "注意事项",
    items: [
      <>原作者允许免费用于作品制作，包括商业作品、编辑加工与服装参考。</>,
      <>
        <strong>禁止对图片数据本身（原尺寸或加工后）进行再分发、转载或转售。</strong>
      </>,
      <>署名不是必须的（可自愿标注）。图片元数据已删除，素材按无保证方式提供。</>,
      <>图中为 AI 生成的虚构服装，并非真实商品。</>,
      <>请勿用于真实人物、未成年人相关用途或违反公序良俗的用途。</>,
    ],
    note: (
      <>
        以上为原站注意事项的中文整理。完整条款以原作者发布内容为准；本镜像的公开展示与转载授权问题，请站点维护者另行确认。
      </>
    ),
  },
];

export const POSE_INFO: InfoTab[] = [
  {
    label: "使用指南",
    heading: "使用指南",
    items: [
      <>
        将参考图导入各类 AI 工具的<strong>姿势参考 / 构图参考</strong>功能。
      </>,
      <>同一姿势连续使用多个视角，更容易保持生成图片或视频中的姿态一致。</>,
      <>
        切换「按姿势」可查看同一姿势的 5 个视角，点击卡片进入大图，可下载 <strong>900 × 1200 原尺寸 PNG</strong>。
      </>,
      <>图片为无五官的灰色人体素体线稿，不包含面部、服装与背景，请通过提示词或其他参考图补充。</>,
      <>
        电脑端使用 <strong>← / →</strong> 切换角度、<strong>↑ / ↓</strong> 切换姿势；手机端可左右滑动大图。
      </>,
    ],
  },
  {
    label: "注意事项",
    heading: "注意事项",
    items: [
      <>原作者允许免费用于作品制作，包括商业作品、编辑加工与姿势参考。</>,
      <>
        <strong>禁止对图片数据本身（原尺寸或加工后）进行再分发、转载或转售。</strong>
      </>,
      <>署名不是必须的（可自愿标注）。图片元数据已删除，素材按无保证方式提供。</>,
      <>图中为人体素体线稿，并非真实人物。</>,
      <>请勿用于真实人物、未成年人相关用途或违反公序良俗的用途。</>,
    ],
    note: (
      <>
        以上为原站注意事项的中文整理。完整条款以原作者发布内容为准；本镜像的公开展示与转载授权问题，请站点维护者另行确认。
      </>
    ),
  },
];

export const PORTRAIT_INFO: InfoTab[] = [
  {
    label: "使用指南",
    heading: "使用指南",
    items: [
      <>
        作为参考图，载入各类 AI 工具的<strong>角色参考 / 人脸参考</strong>功能。
      </>,
      <>
        想让脸保持一致时选「<strong>面部特写</strong>」；参考服装、发质与整体气质时选「<strong>造型参考</strong>」。
      </>,
      <>持续使用同一张参考图，生成图片或视频中的脸更容易保持一致。</>,
      <>下载原始尺寸 PNG 使用，可参考到细节。灯箱里的大图为原站原尺寸文件。</>,
    ],
  },
  {
    label: "注意事项",
    heading: "注意事项",
    items: [
      <>以 CC0 协议自由使用，<strong>商用、编辑、参考用途均可</strong>。</>,
      <>均为 AI 生成的虚构人物，<strong>并不真实存在</strong>。</>,
      <>
        <strong>禁止</strong>用于冒充真实人物，或违反公序良俗的用途。
      </>,
      <>请不要对图像数据本身进行再分发或转载（原作者的请求）。</>,
      <>无需署名（自愿）。图像元数据已删除，素材按无保证方式提供。</>,
    ],
    note: <>原文授权为 CC0 1.0；本页为中文整理，完整条款以原作者发布内容为准。</>,
  },
];

export const INFO_BY_SLUG: Record<string, InfoTab[]> = {
  costume: COSTUME_INFO,
  pose: POSE_INFO,
  portrait: PORTRAIT_INFO,
};
