import type { Metadata } from "next";
import Gallery from "@/components/gallery/Gallery";
import poseJson from "@/data/galleries/pose.json";
import type { GalleryData } from "@/components/gallery/types";

export const metadata: Metadata = {
  title: "姿势库 · AI 参考集合",
  description:
    "288 组人体姿势、1439 张多角度参考图，可按体系、动作分类与视角筛选。",
};

export default function PosePage() {
  return <Gallery data={poseJson as unknown as GalleryData} />;
}
