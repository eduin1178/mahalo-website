"use client";

import { useCallback } from "react";

// PLACEHOLDER: replace with real data — see follow-up change (lib/plans/queries)
// Provider brand colors match the business config (active providers only).
const PLANS = [
  {
    speed: "300 Mbps",
    price: "$29.99",
    period: "/mo",
    provider: "Optimum",
    stripeColor: "#005EB8",
    tag: "Best value",
  },
  {
    speed: "1 Gig",
    price: "$59.99",
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
  onCta: () => void;
}

function PlanCard({ speed, price, period, provider, stripeColor, tag, onCta }: PlanCardProps) {
  return (
    <article className="relative flex flex-col rounded-2xl border border-border bg-background shadow-md overflow-hidden">
      {/* Provider brand color stripe */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: stripeColor }}
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col gap-4 p-6">
        {tag && (
          <span className="inline-block self-start rounded-full bg-mahalo-cyan-500/10 px-3 py-0.5 text-xs font-semibold text-mahalo-blue-600">
            {tag}
          </span>
        )}

        <div>
          <p className="text-3xl font-bold tracking-tight text-mahalo-navy-900">
            {speed}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">Download speed</p>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-mahalo-navy-900">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          via <span className="text-mahalo-navy-900 font-semibold">{provider}</span>
        </p>

        <button
          type="button"
          onClick={onCta}
          className="mt-auto w-full rounded-xl border-2 border-mahalo-navy-900 px-4 py-2.5 text-sm font-semibold text-mahalo-navy-900 transition-colors hover:bg-mahalo-navy-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500"
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
 * The component is otherwise static — PLANS is a compile-time constant and
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
      className="border-b border-border/40 bg-surface"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">Plans in your area</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          Real plans. Real prices.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Enter your address to see every plan available at your door — these
          are examples of what&apos;s typically available.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.provider} {...plan} onCta={scrollToHero} />
          ))}
        </div>

        {/* Disclaimer required by spec */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Indicative pricing — varies by address. Availability depends on your
          location and provider coverage.
        </p>
      </div>
    </section>
  );
}
