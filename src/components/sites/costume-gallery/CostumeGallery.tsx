"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import costumesJson from "@/data/costumes.json";
import metaJson from "@/data/meta.json";
import type { Costume, GalleryMeta } from "./types";
import { fmt, hit } from "./match";
import { categoryZh, tokenZh } from "./zh";
import { PAGE_SIZE, thumbUrl } from "./source";
import InfoTabs from "./InfoTabs";
import Lightbox from "./Lightbox";
import SocialLinks from "./SocialLinks";
import { COSTUME_INFO } from "@/components/site/info";

const costumes = costumesJson as unknown as Costume[];
const meta = metaJson as GalleryMeta;

function Card({
  item,
  index,
  onOpen,
}: {
  item: Costume;
  index: number;
  onOpen: (i: number) => void;
}) {
  return (
    <article
      className="card"
      tabIndex={0}
      data-i={index}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(index);
      }}
    >
      <div className="ph" data-id={item.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="lazy"
          decoding="async"
          src={thumbUrl(item.サムネ)}
          alt={item.id}
        />
      </div>
      <div className="meta">
        <div className="row">
          <div className="id">{item.id}</div>
          <div className="cat">{categoryZh(item.カテゴリ)}</div>
        </div>
        <div className="desc">
          {item.キーワード.split(" ").map(tokenZh).join(" · ")}
        </div>
      </div>
    </article>
  );
}

export default function CostumeGallery() {
  const [cat, setCat] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [n, setN] = useState(PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toolsRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);

  const view = useMemo(
    () => costumes.filter((d) => hit(d, cat, query)),
    [cat, query]
  );

  // 150ms debounce on the search box, resetting pagination — as in the source.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(draft.trim().toLowerCase());
      setN(PAGE_SIZE);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const addMore = useCallback(() => {
    setN((prev) => (prev >= view.length ? prev : prev + PAGE_SIZE));
  }, [view.length]);

  // Auto-append ahead of the viewport.
  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) addMore();
      },
      { rootMargin: "800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [addMore]);

  const selectCat = (value: string) => {
    setCat(value);
    setN(PAGE_SIZE);
    const el = toolsRef.current;
    if (el) window.scrollTo({ top: Math.min(window.scrollY, el.offsetTop) });
  };

  const closeModal = useCallback(() => {
    if (openIndex !== null) {
      document
        .querySelector<HTMLElement>(`.card[data-i="${openIndex}"]`)
        ?.focus();
    }
    setOpenIndex(null);
  }, [openIndex]);

  const step = (delta: number) => {
    if (openIndex === null) return;
    const next = openIndex + delta;
    if (next < 0 || next >= view.length) return;
    if (next >= n) setN((prev) => prev + PAGE_SIZE);
    setOpenIndex(next);
  };

  useEffect(() => {
    if (openIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openIndex]);

  const tabs = [
    { value: "", label: "全部", count: meta.total },
    ...meta.cats.map((c) => ({
      value: c,
      label: categoryZh(c),
      count: meta.counts[c] ?? 0,
    })),
  ];

  const shown = view.slice(0, n);
  const remaining = Math.max(view.length - n, 0);

  return (
    <>
      <header className="hero">
        <div className="hero-top">
          <div className="eyebrow">COSTUME-DB-01 ・ 图像参考用服装集</div>
          <div className="hero-actions">
            <SocialLinks />
            <InfoTabs tabs={COSTUME_INFO} />
          </div>
        </div>
        <h1>
          <span>服装集</span> 数据库
        </h1>
        <p className="sub">
          不含人物的纯服装图像（2:3）。可按春・夏・秋・冬・内衣・派对・泳装・性感分类浏览。
        </p>
      </header>

      <div className="tools" ref={toolsRef}>
        <div className="tools-in">
          <div className="tabs" id="tabs" role="tablist" aria-label="分类">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                className="tab"
                role="tab"
                data-v={tab.value}
                aria-selected={cat === tab.value}
                onClick={() => selectCat(tab.value)}
              >
                {tab.label}
                <em>{fmt(tab.count)} 张</em>
              </button>
            ))}
          </div>
          <div className="row2">
            <label className="search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id="q"
                type="search"
                placeholder="搜索 ID 或关键词　例：蕾丝、牛仔、黑色"
                autoComplete="off"
                aria-label="搜索"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <span className="count" id="count">
              显示 {fmt(view.length)} 张
            </span>
          </div>
        </div>
      </div>

      <main>
        <div className="grid" id="grid">
          {shown.map((item, index) => (
            <Card
              key={item.id}
              item={item}
              index={index}
              onOpen={setOpenIndex}
            />
          ))}
          {view.length === 0 && (
            <div className="empty" style={{ gridColumn: "1 / -1" }}>
              <b>没有符合条件的图像</b>
              请更换分类或搜索词再试。
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn2 morebtn"
          id="more"
          ref={moreRef}
          hidden={view.length <= n}
          onClick={addMore}
        >
          加载更多（剩余 {fmt(remaining)} 张）
        </button>
      </main>

      <Lightbox
        item={openIndex === null ? null : (view[openIndex] ?? null)}
        onClose={closeModal}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
    </>
  );
}
