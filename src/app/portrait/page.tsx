import type { Metadata } from "next";
import Gallery from "@/components/gallery/Gallery";
import portraitJson from "@/data/galleries/portrait.json";
import type { GalleryData } from "@/components/gallery/types";

export const metadata: Metadata = {
  title: "人脸库 · AI 参考集合",
  description:
    "1499 张 AI 生成人像参考图，面部特写与造型参考两类，可按发型筛选。",
};

export default function PortraitPage() {
  return <Gallery data={portraitJson as unknown as GalleryData} />;
}
