import type { Metadata } from "next";
import Link from "next/link";
import costumesJson from "@/data/costumes.json";
import poseJson from "@/data/galleries/pose.json";
import portraitJson from "@/data/galleries/portrait.json";

export const metadata: Metadata = {
  title: "AI 参考集合 · 人脸 / 姿势 / 服装",
  description:
    "面向 AI 绘画与视频创作的一站式参考图库：人脸、姿势、服装三大板块，全部中文化。",
};

const n = (x: unknown) => (x as unknown[]).length.toLocaleString("zh-CN");

const CARDS = [
  {
    href: "/portrait",
    tag: "PORTRAIT",
    title: "人脸库",
    desc: "面部特写用来锁定五官，造型参考覆盖发型与整体气质，可作角色一致性的人脸参照。",
    count: n((portraitJson as { items: unknown[] }).items),
  },
  {
    href: "/pose",
    tag: "POSE",
    title: "姿势库",
    desc: "288 组人体姿势、5 个视角，同一姿势多视角连用更容易保持姿态一致。",
    count: n((poseJson as { items: unknown[] }).items),
  },
  {
    href: "/costume",
    tag: "COSTUME",
    title: "服装库",
    desc: "不含人物的纯服装图像，按季节与风格分类，适合做服装与质感参考。",
    count: n(costumesJson),
  },
];

export default function Home() {
  return (
    <div className="landing">
      <div className="eyebrow">Reference Atlas ・ 三大参考板块</div>
      <h1>
        给 AI 绘画的<span>参考集合</span>
      </h1>
      <p className="lead">
        把人脸、姿势、服装三类参考图放进同一个站：统一的导航、统一的中文标注、统一的筛选与检索。
        每张图都能进灯箱看大图，并直接打开原尺寸文件。
      </p>

      <div className="lcards">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="lcard">
            <span className="n">{c.tag}</span>
            <span className="t">{c.title}</span>
            <span className="d">{c.desc}</span>
            <span className="c">{c.count} 张 →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
