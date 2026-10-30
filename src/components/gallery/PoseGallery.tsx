"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GalleryData, GalleryItem } from "./types";
import InfoTabs, { type InfoTab } from "@/components/sites/costume-gallery/InfoTabs";
import SocialLinks from "@/components/sites/costume-gallery/SocialLinks";

type PoseItem = GalleryItem & { g: string; a: string };
type PoseData = GalleryData & {
  group: { by: string; angle: string; order: string[] };
};

const PAGE_SIZE = 120;
const BASE = "/sites/pose-gallery/";

const anglesOf = (list: PoseItem[], order: string[]) =>
  [...list].sort((a, b) => order.indexOf(a.a) - order.indexOf(b.a));

type Open =
  | { mode: "pose"; g: number; a: number }
  | { mode: "single"; i: number }
  | null;

export default function PoseGallery({ data, infoTabs }: { data: PoseData; infoTabs?: InfoTab[] }) {
  const [system, setSystem] = useState("");
  const [cat, setCat] = useState("");
  const [angle, setAngle] = useState("");
  const [view, setView] = useState<"pose" | "single">("pose");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [n, setN] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Open>(null);

  const items = data.items as PoseItem[];
  const primary = data.facets.find((f) => f.primary) ?? data.facets[0];
  const catFacet = data.facets.find((f) => f.key === "cat");
  const angleFacet = data.facets.find((f) => f.key === "angle");

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(draft.trim());
      setN(PAGE_SIZE);
    }, 180);
    return () => clearTimeout(t);
  }, [draft]);

  const filtered = useMemo(() => {
    const words = query ? query.split(/\s+/) : [];
    return items.filter((it) => {
      if (system && it.f[0] !== system) return false;
      if (cat && it.f[1] !== cat) return false;
      if (angle && it.f[2] !== angle) return false;
      if (!words.length) return true;
      const hay = `${it.id} ${it.n} ${it.d} ${it.f.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w.toLowerCase()));
    });
  }, [items, system, cat, angle, query]);

  // Group the filtered rows by pose, preserving source order.
  const groups = useMemo(() => {
    const map = new Map<string, PoseItem[]>();
    for (const it of filtered) {
      const list = map.get(it.g);
      if (list) list.push(it);
      else map.set(it.g, [it]);
    }
    return [...map.entries()].map(([key, list]) => ({ key, list }));
  }, [filtered]);

  const shownGroups = groups.slice(0, n);
  const shownItems = filtered.slice(0, n);
  const total = view === "pose" ? groups.length : filtered.length;
  const shownNow = view === "pose" ? shownGroups.length : shownItems.length;
  const remaining = Math.max(total - shownNow, 0);

  const reset = () => {
    setN(PAGE_SIZE);
    setSystem("");
    setCat("");
    setAngle("");
    setQuery("");
    setDraft("");
  };

  const close = useCallback(() => {
    setOpen(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ←/→ steps the angle inside a pose, ↑/↓ steps the pose (source behaviour).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (open.mode === "single") {
        if (e.key === "ArrowRight") setOpen({ ...open, i: Math.min(open.i + 1, filtered.length - 1) });
        if (e.key === "ArrowLeft") setOpen({ ...open, i: Math.max(open.i - 1, 0) });
        return;
      }
      const poses = groups;
      const list = anglesOf(poses[open.g].list, data.group.order);
      if (e.key === "ArrowRight") setOpen({ ...open, a: Math.min(open.a + 1, list.length - 1) });
      else if (e.key === "ArrowLeft") setOpen({ ...open, a: Math.max(open.a - 1, 0) });
      else if (e.key === "ArrowDown")
        setOpen({ ...open, g: Math.min(open.g + 1, poses.length - 1), a: 0 });
      else if (e.key === "ArrowUp") setOpen({ ...open, g: Math.max(open.g - 1, 0), a: 0 });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, groups, filtered.length, close]);

  const currentPose = open?.mode === "pose" ? groups[open.g] : null;
  const currentAngles = currentPose ? anglesOf(currentPose.list, data.group.order) : [];
  const currentAngleItem = currentPose ? currentAngles[Math.min(open?.mode === "pose" ? open.a : 0, currentAngles.length - 1)] : null;
  const currentSingle = open?.mode === "single" ? filtered[open.i] : null;
  const currentItem = currentAngleItem ?? currentSingle;

  return (
    <>
      <header className="hero">
        <div className="hero-top">
          <div className="eyebrow">{data.eyebrow}</div>
          <div className="hero-actions">
            <SocialLinks />
            {infoTabs ? <InfoTabs tabs={infoTabs} /> : null}
          </div>
        </div>
        <h1>
          <span>{data.title}</span>
        </h1>
        <p className="sub">{data.subtitle}</p>
      </header>

      <div className="tools">
        <div className="tools-in">
          <div className="tabs" role="tablist" aria-label={primary.label}>
            <button className="tab" role="tab" aria-selected={!system} onClick={() => {
                setN(PAGE_SIZE);
                setSystem("");
              }}>
              全部
              <em>{items.length.toLocaleString("zh-CN")} 张</em>
            </button>
            {primary.values.map((v) => (
              <button
                key={v.v}
                className="tab"
                role="tab"
                data-v={v.v}
                aria-selected={system === v.v}
                onClick={() => {
                  setN(PAGE_SIZE);
                  setSystem(system === v.v ? "" : v.v);
                }}
              >
                {v.l}
                <em>{v.n} 张</em>
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
                aria-label="搜索姿势"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>

            {catFacet && (
              <label className="gsel">
                <span>分类</span>
                <select value={cat} onChange={(e) => {
                    setN(PAGE_SIZE);
                    setCat(e.target.value);
                  }}>
                  <option value="">全部</option>
                  {catFacet.values.map((v) => (
                    <option key={v.v} value={v.v}>
                      {v.l}（{v.n}）
                    </option>
                  ))}
                </select>
              </label>
            )}

            {angleFacet && (
              <div className="seg" role="group" aria-label="按视角筛选">
                <span className="seg-l">视角</span>
                <button
                  type="button"
                  className={!angle ? "on" : ""}
                  aria-pressed={!angle}
                  onClick={() => {
                    setN(PAGE_SIZE);
                    setAngle("");
                  }}
                >
                  全部
                </button>
                {angleFacet.values.map((v) => (
                  <button
                    key={v.v}
                    type="button"
                    className={angle === v.v ? "on" : ""}
                    aria-pressed={angle === v.v}
                    onClick={() => {
                      setN(PAGE_SIZE);
                      setAngle(angle === v.v ? "" : v.v);
                    }}
                  >
                    {v.l}
                  </button>
                ))}
              </div>
            )}

            <div className="seg" role="group" aria-label="切换展示方式">
              <span className="seg-l">展示</span>
              <button
                type="button"
                className={view === "pose" ? "on" : ""}
                aria-pressed={view === "pose"}
                onClick={() => {
                  setN(PAGE_SIZE);
                  setView("pose");
                }}
              >
                按姿势
              </button>
              <button
                type="button"
                className={view === "single" ? "on" : ""}
                aria-pressed={view === "single"}
                onClick={() => {
                  setN(PAGE_SIZE);
                  setView("single");
                }}
              >
                逐张
              </button>
            </div>

            <button type="button" className="gbtn" onClick={reset}>
              重置
            </button>

            <span className="count">
              显示 {filtered.length.toLocaleString("zh-CN")} 张 · {groups.length} 组
            </span>
          </div>
        </div>
      </div>

      <main>
        <div className="grid" style={{ ["--ar" as string]: data.ratio }}>
          {view === "pose"
            ? shownGroups.map((grp, gi) => {
                const list = anglesOf(grp.list, data.group.order);
                const head = list[0];
                return (
                  <article
                    key={grp.key}
                    className="card"
                    tabIndex={0}
                    onClick={() => setOpen({ mode: "pose", g: gi, a: 0 })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setOpen({ mode: "pose", g: gi, a: 0 });
                    }}
                  >
                    <div className="ph" data-id={head.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="lazy"
                        decoding="async"
                        src={BASE + head.t}
                        alt={head.n}
                        width={head.w}
                        height={head.h}
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset.fallback === "1") return;
                          el.dataset.fallback = "1";
                          el.src = head.tu;
                        }}
                      />
                      <div className="badge">
                        <span>{list.length} 视角</span>
                      </div>
                    </div>
                    <div className="meta">
                      <div className="row">
                        <div className="id gname">{head.n}</div>
                      </div>
                      <div className="desc">{head.d}</div>
                    </div>
                  </article>
                );
              })
            : shownItems.map((item, i) => (
                <article
                  key={item.id}
                  className="card"
                  tabIndex={0}
                  onClick={() => setOpen({ mode: "single", i })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setOpen({ mode: "single", i });
                  }}
                >
                  <div className="ph" data-id={item.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      decoding="async"
                      src={BASE + item.t}
                      alt={item.n}
                      width={item.w}
                      height={item.h}
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.dataset.fallback === "1") return;
                        el.dataset.fallback = "1";
                        el.src = item.tu;
                      }}
                    />
                    <div className="badge">
                      <span>{item.a}</span>
                    </div>
                  </div>
                  <div className="meta">
                    <div className="row">
                      <div className="id gname">{item.n}</div>
                    </div>
                    <div className="desc">{item.d}</div>
                  </div>
                </article>
              ))}
          {total === 0 && (
            <div className="empty" style={{ gridColumn: "1 / -1" }}>
              <b>没有符合条件的姿势</b>
              请更换筛选条件或搜索词再试。
            </div>
          )}
        </div>
        {remaining > 0 && (
          <button type="button" className="btn2 morebtn" onClick={() => setN((v) => v + PAGE_SIZE)}>
            加载更多（剩余 {remaining.toLocaleString("zh-CN")} {view === "pose" ? "组" : "张"}）
          </button>
        )}
      </main>

      <div
        className={open ? "modal open" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-label="放大查看"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button className="close" aria-label="关闭" onClick={close}>
          ×
        </button>
        <div className="mbox">
          <div className="mimg">
            {currentItem ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mph" src={BASE + currentItem.t} alt="" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mfull"
                  key={currentItem.id}
                  src={currentItem.u}
                  alt={currentItem.n}
                  onLoad={(e) => e.currentTarget.classList.add("ready")}
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.classList.remove("ready");
                    if (el.dataset.fallback === "1") return;
                    el.dataset.fallback = "1";
                    el.src = currentItem.tu;
                  }}
                />
              </>
            ) : null}
            <button
              className="nav l"
              aria-label="上一个视角"
              onClick={() => {
                if (open?.mode === "pose") setOpen({ ...open, a: Math.max(open.a - 1, 0) });
                else if (open?.mode === "single") setOpen({ ...open, i: Math.max(open.i - 1, 0) });
              }}
            >
              ‹
            </button>
            <button
              className="nav r"
              aria-label="下一个视角"
              onClick={() => {
                if (open?.mode === "pose")
                  setOpen({ ...open, a: Math.min(open.a + 1, currentAngles.length - 1) });
                else if (open?.mode === "single")
                  setOpen({ ...open, i: Math.min(open.i + 1, filtered.length - 1) });
              }}
            >
              ›
            </button>
          </div>

          <div className="mside">
            <div className="mhead">
              <div>
                <h2>{currentItem?.n ?? ""}</h2>
                <div className="id">{currentItem?.id ?? ""}</div>
              </div>
              {open?.mode === "pose" && (
                <span className="pager">
                  {open.g + 1} / {groups.length}
                </span>
              )}
            </div>

            {open?.mode === "pose" && currentAngles.length > 1 && (
              <div>
                <div className="manglabel">切换视角</div>
                <div className="mang">
                  {currentAngles.map((it, ai) => (
                    <button
                      key={it.id}
                      type="button"
                      className={open.a === ai ? "on" : ""}
                      aria-pressed={open.a === ai}
                      aria-label={it.a}
                      onClick={() => setOpen({ ...open, a: ai })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={BASE + it.t} alt={it.a} loading="lazy" />
                      <span>{it.a}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <a className="dl" href={currentItem?.u ?? "#"} target="_blank" rel="noopener noreferrer">
              下载原尺寸 PNG
            </a>

            <dl className="kv">
              <dt>体系</dt>
              <dd>{currentItem?.f[0]}</dd>
              <dt>姿势编号</dt>
              <dd>{currentItem?.d.split(" · ")[0]}</dd>
              <dt>动作分类</dt>
              <dd>{currentItem?.f[1]}</dd>
              <dt>当前视角</dt>
              <dd>{currentItem?.a ?? "—"}</dd>
              <dt>图片规格</dt>
              <dd>900 × 1200 PNG</dd>
            </dl>

            <div className="keys">
              {open?.mode === "pose" ? (
                <>
                  <kbd>←</kbd>
                  <kbd>→</kbd> 切换视角　<kbd>↑</kbd>
                  <kbd>↓</kbd> 切换姿势　<kbd>Esc</kbd> 关闭
                </>
              ) : (
                <>
                  <kbd>←</kbd>
                  <kbd>→</kbd> 上一张 / 下一张　<kbd>Esc</kbd> 关闭
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
