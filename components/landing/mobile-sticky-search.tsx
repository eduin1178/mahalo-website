"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * MobileStickySearch
 *
 * Sticky bottom ZIP-code search bar visible on mobile only.
 * Appears once the visitor scrolls past #hero-end-sentinel.
 * Hides when #final-cta enters the viewport to avoid duplication.
 * Uses two IntersectionObservers — no scroll-event listener.
 *
 * Accessibility:
 * - aria-hidden + inert when not visible → no focus trap
 * - Labelled as a complementary region
 * - Respects prefers-reduced-motion (no slide-in animation when set)
 */
export function MobileStickySearch() {
  const router = useRouter();
  const [pastHero, setPastHero] = useState(false);
  const [finalCtaInView, setFinalCtaInView] = useState(false);

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: hero sentinel
  useEffect(() => {
    const sentinel = document.getElementById("hero-end-sentinel");
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // IntersectionObserver: final CTA
  useEffect(() => {
    const cta = document.getElementById("final-cta");
    if (!cta) return;

    const obs = new IntersectionObserver(
      ([entry]) => setFinalCtaInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(cta);
    return () => obs.disconnect();
  }, []);

  const visible = pastHero && !finalCtaInView;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Enter a 5-digit ZIP code to continue.");
      return;
    }
    // ZIP-only: keep this in sync with the hero search (no address branch).
    if (!/^\d{5}$/u.test(trimmed)) {
      setError("Enter a 5-digit ZIP code.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("zip", trimmed);
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    /*
     * md:hidden — never rendered on desktop viewports.
     * When not visible: aria-hidden + inert prevent focus trapping.
     * prefers-reduced-motion: Tailwind's motion-safe/motion-reduce utilities
     * handle the slide-in transition so no animation fires when user prefers reduced.
     */
    <div
      ref={barRef}
      aria-hidden={!visible}
      inert={!visible}
      aria-label="Quick internet availability search"
      role="complementary"
      className={[
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-white/10 bg-mahalo-navy-900 px-4 py-3 shadow-[0_-4px_20px_rgba(11,31,77,0.25)]",
        // Slide + fade transition — disabled when prefers-reduced-motion is set
        "motion-safe:transition-all motion-safe:duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Check internet availability"
        className="flex items-stretch gap-2"
      >
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mahalo-blue-600"
          />
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="ZIP code"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "sticky-search-error" : undefined}
            className="h-11 rounded-lg border-2 border-white/20 bg-white pl-9 text-sm font-medium text-mahalo-navy-900 placeholder:text-mahalo-navy-900/40 focus-visible:border-mahalo-cyan-500 focus-visible:ring-mahalo-cyan-500/40"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="h-11 shrink-0 px-4 text-sm font-semibold"
          disabled={submitting}
        >
          {submitting ? "…" : "Search"}
        </Button>
      </form>
      {error && (
        <p
          id="sticky-search-error"
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
