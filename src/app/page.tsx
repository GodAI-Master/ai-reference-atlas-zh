import type { Metadata } from "next";
import CostumeGallery from "@/components/sites/costume-gallery/CostumeGallery";
import "./costume-gallery.css";

export const metadata: Metadata = {
  title: "服装集 COSTUME-DB-01",
  description:
    "不含人物的纯服装图像（2:3）。可按春・夏・秋・冬・内衣・派对・泳装・性感分类浏览。",
};

export default function Home() {
  return <CostumeGallery />;
}
