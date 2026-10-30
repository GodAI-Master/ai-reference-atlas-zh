import type { Metadata } from "next";
import PoseGallery from "@/components/gallery/PoseGallery";
import { DEPTH_INFO } from "@/components/site/info";
import depthJson from "@/data/galleries/depth.json";
import type { GalleryData } from "@/components/gallery/types";

export const metadata: Metadata = {
  title: "深度姿势库 · AI 参考集合",
  description:
    "98 组人体姿势、490 张灰度深度图，与姿势库同一套姿势的三维体块版本，适合深度控制类工作流。",
};

export default function DepthPage() {
  return (
    <PoseGallery
      data={
        depthJson as unknown as GalleryData & {
          group: { by: string; angle: string; order: string[] };
        }
      }
      infoTabs={DEPTH_INFO}
    />
  );
}
