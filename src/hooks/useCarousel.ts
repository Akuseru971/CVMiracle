"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  count: number;
  autoPlay?: boolean;
  interval?: number;
};

/**
 * Native horizontal scroll carousel helper.
 * - Manual swipe works out of the box (overflow-x scroll + snap).
 * - Tracks the active slide from scroll position.
 * - Exposes arrow/dot navigation and optional autoplay (pauses on touch).
 */
export function useCarousel<T extends HTMLElement = HTMLDivElement>({
  count,
  autoPlay = false,
  interval = 5000,
}: Options) {
  const ref = useRef<T | null>(null);
  const [active, setActive] = useState(0);
  const interacting = useRef(false);

  const goTo = useCallback((index: number) => {
    const el = ref.current;
    if (!el) return;
    const clamped = ((index % count) + count) % count;
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
  }, [count]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const children = Array.from(el.children) as HTMLElement[];
        const center = el.scrollLeft + el.clientWidth / 2;
        let closest = 0;
        let min = Infinity;
        children.forEach((child, i) => {
          const childCenter = child.offsetLeft - el.offsetLeft + child.clientWidth / 2;
          const dist = Math.abs(childCenter - center);
          if (dist < min) {
            min = dist;
            closest = i;
          }
        });
        setActive(closest);
      });
    };

    const onTouchStart = () => {
      interacting.current = true;
    };
    const onTouchEnd = () => {
      window.setTimeout(() => {
        interacting.current = false;
      }, 1200);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    const id = window.setInterval(() => {
      if (!interacting.current) {
        goTo(active + 1);
      }
    }, interval);
    return () => window.clearInterval(id);
  }, [autoPlay, interval, count, active, goTo]);

  return { ref, active, goTo, next, prev };
}
