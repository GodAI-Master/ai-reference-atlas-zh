import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./costume-gallery.css";
import "./shell.css";
import SiteNav from "@/components/site/SiteNav";
import costumesJson from "@/data/costumes.json";
import poseJson from "@/data/galleries/pose.json";
import portraitJson from "@/data/galleries/portrait.json";

export const metadata: Metadata = {
  title: "AI 参考集合 · 人脸 / 姿势 / 服装",
  description:
    "面向 AI 绘画与视频创作的一站式参考图库：人脸库 1499 张、姿势库 1439 张、服装库 1407 张，全部中文化，可按维度筛选。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const counts = {
  portrait: (portraitJson as { items: unknown[] }).items.length,
  pose: (poseJson as { items: unknown[] }).items.length,
  costume: (costumesJson as unknown[]).length,
};

/* Fonts: the source styles everything with a system CJK stack and loads no
   webfonts, so no font requests are made. The stack is Chinese-first
   (PingFang SC / Microsoft YaHei / Noto Sans SC), see costume-gallery.css. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">
        <div className="app">
          <aside className="side">
            <a className="brand" href="/">
              <b>AI 参考集合</b>
              <span>reference atlas</span>
            </a>
            <SiteNav counts={counts} />
            <div className="sidefoot">
              <a
                href="https://github.com/GodAI-Master/ai-costume-gallery-zh"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span>GitHub 仓库</span>
              </a>
              <a
                href="https://v.douyin.com/SpMqdao0Fl0/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.5 2h2.6c.3 1.6 1.4 2.9 3 3.3v2.7c-1.2-.1-2.4-.5-3.4-1.2v6.1c0 3.2-2.6 5.8-5.8 5.8S3 16.1 3 12.9s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1V2z" />
                </svg>
                <span>抖音</span>
              </a>
            </div>
          </aside>
          <div className="appmain">{children}</div>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
