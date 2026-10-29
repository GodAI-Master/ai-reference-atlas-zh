import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "服装集 COSTUME-DB-01",
  description: "不含人物的纯服装参考图库",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* The source styles everything with a system CJK stack and loads no webfonts, so the
   template's Geist setup is dropped and no font requests are made. The stack is
   reordered for Chinese (PingFang SC / Microsoft YaHei / Noto Sans SC) instead of
   the Japanese Hiragino / Yu Gothic / Meiryo order. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
