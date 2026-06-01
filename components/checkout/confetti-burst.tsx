"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single celebratory confetti burst on mount. Client-only leaf so the
 * confirmation page can stay server-rendered. `canvas-confetti` is imported
 * dynamically (it touches `window`/`document`) and the burst is suppressed
 * entirely when the user requests reduced motion.
 */
export function ConfettiBurst() {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hasFired.current = true;

    let cancelled = false;
    const colors = ["#0b1f4d", "#2a5bc7", "#3fd0e0", "#ffffff"];

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors });

      const end = Date.now() + 600;
      (function frame() {
        if (cancelled) return;
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
