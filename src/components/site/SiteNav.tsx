"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Counts = { portrait: number; pose: number; costume: number };

const LINKS = [
  { href: "/portrait", label: "人脸库", key: "portrait" as const, hint: "面部与造型参考" },
  { href: "/pose", label: "姿势库", key: "pose" as const, hint: "多角度人体姿势" },
  { href: "/costume", label: "服装库", key: "costume" as const, hint: "不含人物的服装" },
];

export default function SiteNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();

  return (
    <nav className="snav" aria-label="参考库导航">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className="navlink"
            aria-current={active ? "page" : undefined}
          >
            <span className="navtext">
              <b>{l.label}</b>
              <i>{l.hint}</i>
            </span>
            <em>{counts[l.key].toLocaleString("zh-CN")}</em>
          </Link>
        );
      })}
    </nav>
  );
}
