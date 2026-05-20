"use client";

import { useEffect, useRef } from "react";

/**
 * SiteHeaderScrollWrapper
 *
 * Thin client wrapper that sets `data-scrolled="true|false"` on its root
 * element based on whether #hero-end-sentinel has scrolled past the viewport.
 *
 * When #hero-end-sentinel is absent (admin, checkout, legal routes), the
 * wrapper defaults to data-scrolled="true" (solid header) on mount.
 *
 * CSS in site-header.tsx uses the data-scrolled attribute to toggle
 * transparent vs solid background — no JS in the hot path.
 */
export function SiteHeaderScrollWrapper({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = document.getElementById("hero-end-sentinel");

    if (!sentinel) {
      // Route has no hero — stay solid immediately
      wrapperRef.current?.setAttribute("data-scrolled", "true");
      return;
    }

    // Start transparent (we are at the top over the hero)
    wrapperRef.current?.setAttribute("data-scrolled", "false");

    const obs = new IntersectionObserver(
      ([entry]) => {
        wrapperRef.current?.setAttribute(
          "data-scrolled",
          entry.isIntersecting ? "false" : "true",
        );
      },
      { threshold: 0 },
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} data-scrolled="true" className="contents">
      {children}
    </div>
  );
}
