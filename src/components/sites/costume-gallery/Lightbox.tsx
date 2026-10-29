"use client";

import { useEffect, useRef, useState } from "react";
import type { Costume } from "./types";
import { displayUrl, pngHref, thumbUrl } from "./source";
import { categoryZh } from "./zh";

type Props = {
  item: Costume | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function Lightbox({ item, onClose, onPrev, onNext }: Props) {
  const [upgraded, setUpgraded] = useState<{ id: string; src: string } | null>(
    null
  );
  const touchX = useRef<number | null>(null);

  // Thumbnail is the base image; the larger display image is swapped in once it
  // decodes — the same progressive upgrade the source performs.
  useEffect(() => {
    if (!item) return;
    let cancelled = false;

    const full = new window.Image();
    full.onload = () => {
      if (!cancelled) setUpgraded({ id: item.id, src: displayUrl(item.画像) });
    };
    full.src = displayUrl(item.画像);

    return () => {
      cancelled = true;
    };
  }, [item]);

  const src = item
    ? upgraded && upgraded.id === item.id
      ? upgraded.src
      : thumbUrl(item.サムネ)
    : "";

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [item, onClose, onNext, onPrev]);

  return (
    <div
      id="modal"
      className={item ? "modal open" : "modal"}
      role="dialog"
      aria-modal="true"
      aria-label="放大查看"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button id="mclose" className="close" aria-label="关闭" onClick={onClose}>
        ×
      </button>
      <div className="mbox">
        <div className="mimg">
          {item ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              id="mimg"
              src={src}
              alt={item.id}
              onTouchStart={(e) => {
                touchX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(dx) > 40) (dx < 0 ? onNext : onPrev)();
                touchX.current = null;
              }}
            />
          ) : null}
          <button id="mprev" className="nav l" aria-label="上一张" onClick={onPrev}>
            ‹
          </button>
          <button id="mnext" className="nav r" aria-label="下一张" onClick={onNext}>
            ›
          </button>
        </div>
        <div className="mside">
          <div>
            <h2 id="mtitle">{item?.id ?? ""}</h2>
            <div className="id" id="mcat">
              {item ? categoryZh(item.カテゴリ) : ""}
            </div>
          </div>
          <a
            className="dl"
            id="mdl"
            href={item ? pngHref(item.id) : "#"}
            download={item ? `${item.id}.png` : undefined}
          >
            下载原图（PNG）
          </a>
          <div className="keys">
            <kbd>←</kbd>
            <kbd>→</kbd> 上一张 / 下一张　<kbd>Esc</kbd> 关闭
          </div>
        </div>
      </div>
    </div>
  );
}
