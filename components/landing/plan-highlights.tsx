"use client";

import { useCallback, type CSSProperties } from "react";

// PLACEHOLDER: replace with real data - see follow-up change (lib/plans/queries)
// Provider brand colors match the business config (active providers only).
const PLANS = [
  {
    speed: "300 Mbps",
    price: "$25.00",
    period: "/mo",
    provider: "Optimum",
    stripeColor: "#005EB8",
    tag: "Best value",
  },
  {
    speed: "1 Gig",
    price: "$49.99",
    period: "/mo",
    provider: "Frontier",
    stripeColor: "#CE2026",
    tag: "Most popular",
  },
  {
    speed: "2 Gig",
    price: "$89.99",
    period: "/mo",
    provider: "Verizon Fios",
    stripeColor: "#CD040B",
    tag: "Fastest",
  },
] as const;

function useScrollToHero() {
  return useCallback(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    hero.scrollIntoView({ behavior: prefersReduced ? "instant" : "smooth" });

    const input = hero.querySelector<HTMLInputElement>("input[type='text']");
    if (input) {
      setTimeout(() => input.focus(), prefersReduced ? 0 : 350);
    }
  }, []);
}

interface PlanCardProps {
  speed: string;
  price: string;
  period: string;
  provider: string;
  stripeColor: string;
  tag?: string;
  index: number;
  onCta: () => void;
}

function PlanCard({
  speed,
  price,
  period,
  provider,
  stripeColor,
  tag,
  index,
  onCta,
}: PlanCardProps) {
  const style = {
    animationDelay: `${index * 90}ms`,
  } as CSSProperties;

  return (
    <article
      className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-3xl premium-light-card motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-5 motion-safe:zoom-in-95 motion-safe:duration-700 motion-reduce:animate-none motion-reduce:transform-none motion-reduce:transition-none transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_42px_110px_rgba(4,16,45,0.38)] focus-within:-translate-y-2 focus-within:scale-[1.015]"
      style={style}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mahalo-cyan-500/15 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex flex-1 flex-col gap-5 p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          {tag && (
            <span className="inline-flex rounded-full bg-mahalo-navy-900 px-3 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30">
              {tag}
            </span>
          )}
          <span
            className="ml-auto rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-mahalo-navy-900 ring-1 ring-mahalo-navy-900/10"
            style={{ boxShadow: `inset 0 0 0 1px ${stripeColor}33` }}
          >
            {provider}
          </span>
        </div>

        <div>
          <p className="text-4xl font-bold tracking-tight text-mahalo-navy-900 md:text-5xl">
            {speed}
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Download speed
          </p>
        </div>

        <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-mahalo-navy-900/10">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Starting at
          </span>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold tracking-tight text-mahalo-navy-900">
              {price}
            </span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">
              {period}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Indicative monthly rate before address-specific availability check.
          </p>
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          Matched through <span className="font-semibold text-mahalo-navy-900">{provider}</span>
        </p>

        <button
          type="button"
          onClick={onCta}
          className="mt-auto w-full rounded-xl border-2 border-mahalo-navy-900 bg-mahalo-navy-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:border-mahalo-cyan-500 hover:bg-mahalo-navy-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          Check availability
        </button>
      </div>
    </article>
  );
}

/**
 * PlanHighlights
 *
 * "use client" is required only for the scroll-to-hero CTA on each card.
 * The component is otherwise static - PLANS is a compile-time constant and
 * the section renders identically on every request, so the RSC caching
 * benefit is minimal here. If this becomes a concern, extract a
 * <ScrollToHeroButton> client leaf and keep the grid as an RSC.
 */
export function PlanHighlights() {
  const scrollToHero = useScrollToHero();

  return (
    <section
      id="plan-highlights"
      aria-label="Sample internet plans"
      className="relative isolate overflow-hidden border-b border-white/10 bg-mahalo-plans-premium"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,23,58,0.24),rgba(7,23,58,0.68))]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mahalo-cyan-300/70 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mahalo-cyan-300">
          Plans in your area
        </span>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
          Real plans. Real prices.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
          Enter your address to see every plan available at your door - these
          are examples of what&apos;s typically available.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan, index) => (
            <PlanCard
              key={plan.provider}
              {...plan}
              index={index}
              onCta={scrollToHero}
            />
          ))}
        </div>

        {/* Disclaimer required by spec */}
        <p className="mx-auto mt-6 max-w-2xl rounded-full bg-white/10 px-4 py-2 text-center text-xs font-medium text-white/75 ring-1 ring-white/15 backdrop-blur">
          Indicative pricing - varies by address. Availability depends on your
          location and provider coverage.
        </p>
      </div>
    </section>
  );
}


