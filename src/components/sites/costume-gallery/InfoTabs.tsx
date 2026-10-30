"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type InfoTab = {
  label: string;
  heading: string;
  items: ReactNode[];
  note?: ReactNode;
};

/**
 * Content mirrors the guide/notice copy published on ai-pose-gallery.anhao.app
 * (the reference implementation), reproduced verbatim.
 */
export default function InfoTabs({ tabs }: { tabs: InfoTab[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [panelTop, setPanelTop] = useState<number | null>(null);

  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const openRef = useRef<number | null>(null);
  const swallowRef = useRef(false);

  const applyOpen = useCallback((value: number | null) => {
    openRef.current = value;
    setOpen(value);
  }, []);

  const close = useCallback(
    (back: boolean) => {
      const cur = openRef.current;
      if (cur === null) return;
      applyOpen(null);
      setPanelTop(null);
      if (back) tabRefs.current[cur]?.focus();
    },
    [applyOpen]
  );

  const openTab = useCallback(
    (index: number) => {
      if (openRef.current === index) {
        close(true);
        return;
      }
      close(false);
      applyOpen(index);
      // Under 560px the panel is fixed and has to clear the button it belongs to.
      if (window.innerWidth <= 560) {
        const rect = tabRefs.current[index]?.getBoundingClientRect();
        setPanelTop(rect ? rect.bottom + 8 : null);
      } else {
        setPanelTop(null);
      }
      panelRefs.current[index]?.focus({ preventScroll: true });
    },
    [applyOpen, close]
  );

  // Esc closes; captured so the lightbox never sees the same keypress.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current !== null) {
        e.stopPropagation();
        close(true);
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [close]);

  // Outside press closes, and the follow-up click is swallowed so it does not
  // activate whatever sits underneath the panel.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const nav = navRef.current;
      if (openRef.current === null || !nav) return;
      if (!nav.contains(e.target as Node)) {
        close(false);
        swallowRef.current = true;
        window.setTimeout(() => {
          swallowRef.current = false;
        }, 600);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (swallowRef.current) {
        swallowRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [close]);

  useEffect(() => {
    const onScroll = () => {
      if (openRef.current !== null && window.innerWidth <= 560) close(false);
    };
    const onResize = () => close(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [close]);

  return (
    <nav className="infotabs" id="infotabs" ref={navRef} aria-label="使用指南与注意事项">
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          type="button"
          className="itab"
          id={`itab${i}`}
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          aria-haspopup="dialog"
          aria-expanded={open === i}
          aria-controls={`ipanel${i}`}
          onClick={() => openTab(i)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            const step = e.key === "ArrowRight" ? 1 : tabs.length - 1;
            const next = (i + step) % tabs.length;
            tabRefs.current[next]?.focus();
            if (openRef.current !== null) openTab(next);
          }}
        >
          {tab.label}
        </button>
      ))}

      {tabs.map((tab, i) => (
        <div
          key={tab.heading}
          className="ipanel"
          id={`ipanel${i}`}
          role="dialog"
          aria-labelledby={`ipt${i}`}
          tabIndex={-1}
          hidden={open !== i}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          style={
            open === i && panelTop !== null ? { top: `${panelTop}px` } : undefined
          }
        >
          <div className="ipanel-hd">
            <h2 id={`ipt${i}`}>{tab.heading}</h2>
            <button
              type="button"
              className="ipclose"
              aria-label="关闭"
              onClick={() => close(true)}
            >
              ×
            </button>
          </div>
          <ul>
            {tab.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          {tab.note ? <div className="info-note">{tab.note}</div> : null}
        </div>
      ))}
    </nav>
  );
}
