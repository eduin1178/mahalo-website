"use client";

import type { CSSProperties } from "react";

import { ProviderLogoImage } from "@/components/providers/provider-logo-image";

type ProviderItem = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

interface ProvidersCarouselProps {
  providers: ProviderItem[];
}

export function ProvidersCarousel({ providers }: ProvidersCarouselProps) {
  if (providers.length === 0) return null;

  const loop = [...providers, ...providers];
  const duration = Math.max(18, providers.length * 4);

  // Soft fade at both edges so the rail reads as continuous motion rather than
  // hard-cut content — the logos ease in and out instead of popping.
  const edgeFade =
    "linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)";

  return (
    <div
      className="provider-marquee"
      style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade }}
    >
      <ul
        className="provider-marquee-track flex w-max gap-5 px-6 py-4"
        style={{ animation: `provider-marquee ${duration}s linear infinite` }}
      >
        {loop.map((p, i) => {
          const color = p.primaryColor ?? "#3fd0e0";
          const style = { "--provider-color": color } as CSSProperties;
          return (
            <li
              key={`${p.id}-${i}`}
              style={style}
              className="provider-card group relative flex h-24 w-52 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-white/95 to-white/80 px-6 shadow-lg shadow-mahalo-navy-900/30 ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-mahalo-navy-900/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {p.logoUrl ? (
                <ProviderLogoImage
                  src={p.logoUrl}
                  alt={p.name}
                  className="max-h-11 w-auto max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                />
              ) : (
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{ color }}
                >
                  {p.name}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
