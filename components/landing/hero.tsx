import Image from "next/image";

import { ProviderLogoImage } from "@/components/providers/provider-logo-image";

import { HeroSearch } from "./hero-search";

type HeroProvider = {
  id: string;
  name: string;
  logoUrl: string | null;
};

interface HeroProps {
  providers: HeroProvider[];
}

const BENEFITS = [
  "Plans starting at $29.99/mo",
  "30-second availability match",
  "No SSN required online",
] as const;

export function Hero({ providers }: HeroProps) {
  return (
    <section
      id="hero"
      className="bg-mahalo-hero relative isolate overflow-hidden"
      style={{ minHeight: "600px" }}
    >
      <ConnectedHomeBackdrop />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center md:py-28 lg:py-32">
        {/* Eyebrow — white text on a subtle translucent chip */}
        <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-sm">
          Internet plans in your area
        </span>

        {/* H1 — solid white, single visual unit */}
        <h1 className="max-w-[20rem] text-3xl font-bold tracking-tight text-white sm:max-w-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Find the right internet plan for your home.
        </h1>

        {/* Supporting paragraph */}
        <p className="max-w-[20rem] text-base text-white/85 sm:max-w-2xl md:text-lg">
          Compare top providers in your area in seconds — enter your ZIP code or
          address and we&apos;ll show every option available at your door.
        </p>

        {/* Price anchor — the single cyan accent in the hero */}
        <p className="text-sm font-semibold text-mahalo-cyan-300">
          Plans starting at $25.00/mo — no surprise fees
        </p>

        {/* Search — hero variant */}
        <div className="w-full max-w-xl">
          <HeroSearch variant="hero" />
        </div>

        {/* Sub-CTA benefit strip */}
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs font-medium text-white sm:gap-x-6 sm:text-sm">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="text-mahalo-cyan-300" aria-hidden="true">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* Provider strip — logos from the provider catalog, with a uniform
            text fallback when a provider has no logo. */}
        {providers.length > 0 ? (
          <div className="mt-6 w-full border-t border-white/15 pt-8">
            <p className="mb-5 text-xs font-medium tracking-widest text-white/70 uppercase">
              Authorized Reseller
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 sm:gap-x-8 md:gap-x-12">
              {providers.map((p) => (
                <li key={p.id} className="flex items-center">
                  {p.logoUrl ? (
                    <ProviderLogoImage
                      src={p.logoUrl}
                      alt={p.name}
                      className="h-7 w-auto max-w-[140px] object-contain sm:h-8 md:h-9"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white/85 sm:text-base md:text-lg">
                      {p.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Sentinel for IntersectionObserver (header + mobile sticky bar) */}
      <div id="hero-end-sentinel" aria-hidden="true" />
    </section>
  );
}

function ConnectedHomeBackdrop() {
  // Wider, softer radial mask — opacity tapers very gradually so there's no
  // perceptible perimeter. The hero base now matches the image's left-edge
  // tonal curve, so even a slow fade reads as seamless.
  const radialMask =
    "radial-gradient(ellipse 70% 85% at 70% 55%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 100%)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-0 bottom-0 z-0 hidden h-full w-3/5 select-none md:block lg:w-1/2"
    >
      <Image
        src="/hero/connected-home.png"
        alt=""
        fill
        priority
        sizes="(min-width: 768px) 60vw, 0vw"
        className="object-cover object-bottom-right opacity-90"
        style={{
          maskImage: radialMask,
          WebkitMaskImage: radialMask,
        }}
      />
      {/* Soft navy tint over the bright window areas so the warm lights don't
          fight the text contrast — kept light so the cyan WiFi arcs survive. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 65% 65%, rgba(11,31,77,0.15) 0%, rgba(11,31,77,0.3) 60%, rgba(11,31,77,0.5) 100%)",
        }}
      />
    </div>
  );
}
