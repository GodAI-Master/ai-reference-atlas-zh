"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Facet, GalleryData, GalleryItem } from "./types";

const PAGE_SIZE = 120;

const facetBase = (slug: string) => `/sites/${slug}-gallery/`;

function Card({
  item,
  index,
  base,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  base: string;
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
          src={base + item.t}
          alt={item.n}
          onError={(e) => {
            const el = e.currentTarget;
            if (el.dataset.fallback === "1") return;
            el.dataset.fallback = "1";
            el.src = item.tu;
          }}
          width={item.w}
          height={item.h}
        />
      </div>
      <div className="meta">
        <div className="row">
          <div className="id gname">{item.n}</div>
          <div className="cat">{item.d}</div>
        </div>
      </div>
    </article>
  );
}

export default function Gallery({ data }: { data: GalleryData }) {
  const base = facetBase(data.slug);
  const primary = data.facets.find((f) => f.primary) ?? data.facets[0];
  const secondary = data.facets.filter((f) => f !== primary);

  const [picked, setPicked] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [n, setN] = useState(PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toolsRef = useRef<HTMLDivElement | null>(null);

  // Debounced search, same cadence as the costume gallery.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(draft.trim());
      setN(PAGE_SIZE);
    }, 180);
    return () => clearTimeout(t);
  }, [draft]);

  const idxOf = useCallback((key: string) => data.facets.findIndex((f) => f.key === key), [data.facets]);

  const view = useMemo(() => {
    const words = query ? query.split(/\s+/) : [];
    return data.items.filter((it) => {
      for (const [key, value] of Object.entries(picked)) {
        if (!value) continue;
        if (it.f[idxOf(key)] !== value) return false;
      }
      if (!words.length) return true;
      const hay = `${it.id} ${it.n} ${it.d} ${it.f.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w.toLowerCase()));
    });
  }, [data.items, picked, query, idxOf]);

  const shown = view.slice(0, n);
  const remaining = Math.max(view.length - n, 0);

  const selectFacet = (key: string, value: string) => {
    setN(PAGE_SIZE);
    setPicked((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }));
    const el = toolsRef.current;
    if (el) window.scrollTo({ top: Math.min(window.scrollY, el.offsetTop) });
  };

  const closeModal = useCallback(() => {
    if (openIndex !== null) {
      document.querySelector<HTMLElement>(`.card[data-i="${openIndex}"]`)?.focus();
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

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const current = openIndex !== null ? view[openIndex] : null;

  return (
    <>
      <header className="hero">
        <div className="hero-top">
          <div className="eyebrow">{data.eyebrow}</div>
        </div>
        <h1>
          <span>{data.title}</span>
        </h1>
        <p className="sub">{data.subtitle}</p>
      </header>

      <div className="tools" ref={toolsRef}>
        <div className="tools-in">
          <div className="tabs" role="tablist" aria-label={primary.label}>
            <button
              className="tab"
              role="tab"
              data-v=""
              aria-selected={!picked[primary.key]}
              onClick={() => selectFacet(primary.key, "")}
            >
              全部
              <em>{data.items.length.toLocaleString("zh-CN")} {data.unit}</em>
            </button>
            {primary.values.map((v) => (
              <button
                key={v.v}
                className="tab"
                role="tab"
                data-v={v.v}
                aria-selected={picked[primary.key] === v.v}
                onClick={() => selectFacet(primary.key, v.v)}
              >
                {v.l}
                <em>{v.n.toLocaleString("zh-CN")} {data.unit}</em>
              </button>
            ))}
          </div>

          <div className="row2">
            <label className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                placeholder={data.search}
                autoComplete="off"
                aria-label="搜索"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>

            {secondary.map((f: Facet) => (
              <label className="gsel" key={f.key}>
                <span>{f.label}</span>
                <select
                  value={picked[f.key] ?? ""}
                  onChange={(e) => setPicked((p) => ({ ...p, [f.key]: e.target.value }))}
                >
                  <option value="">全部</option>
                  {f.values.map((v) => (
                    <option key={v.v} value={v.v}>
                      {v.l}（{v.n}）
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <span className="count">
              显示 {view.length.toLocaleString("zh-CN")} {data.unit}
            </span>
          </div>
        </div>
      </div>

      <main>
        <div className="grid" style={{ ["--ar" as string]: data.ratio }}>
          {shown.map((item, index) => (
            <Card key={item.id} item={item} index={index} base={base} onOpen={setOpenIndex} />
          ))}
          {view.length === 0 && (
            <div className="empty" style={{ gridColumn: "1 / -1" }}>
              <b>没有符合条件的图像</b>
              请更换筛选条件或搜索词再试。
            </div>
          )}
        </div>
        {remaining > 0 && (
          <button type="button" className="btn2 morebtn" onClick={() => setN((v) => v + PAGE_SIZE)}>
            加载更多（剩余 {remaining.toLocaleString("zh-CN")} {data.unit}）
          </button>
        )}
      </main>

      <div
        className={current ? "modal open" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-label="放大查看"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <button className="close" aria-label="关闭" onClick={closeModal}>
          ×
        </button>
        <div className="mbox">
          <div className="mimg">
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mph" src={base + current.t} alt="" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  id="mimg"
                  className="mfull"
                  key={current.id}
                  src={current.u}
                  alt={current.n}
                  onLoad={(e) => e.currentTarget.classList.add("ready")}
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.classList.remove("ready");
                    if (el.dataset.fallback === "1") return;
                    el.dataset.fallback = "1";
                    el.src = current.tu;
                  }}
                />
              </>
            ) : null}
            <button className="nav l" aria-label="上一张" onClick={() => step(-1)}>
              ‹
            </button>
            <button className="nav r" aria-label="下一张" onClick={() => step(1)}>
              ›
            </button>
          </div>
          <div className="mside">
            <div>
              <h2>{current?.n ?? ""}</h2>
              <div className="id">{current?.d ?? ""}</div>
            </div>
            <a className="dl" href={current?.u ?? "#"} target="_blank" rel="noopener noreferrer">
              打开原图（新窗口）
            </a>
            <div className="keys">
              <kbd>←</kbd>
              <kbd>→</kbd> 上一张 / 下一张　<kbd>Esc</kbd> 关闭
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
