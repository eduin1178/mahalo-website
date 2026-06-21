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

  return (
    <div className="provider-marquee mt-12">
      <ul
        className="provider-marquee-track flex w-max gap-5"
        style={{ animation: `provider-marquee ${duration}s linear infinite` }}
      >
        {loop.map((p, i) => {
          const color = p.primaryColor ?? "#3fd0e0";
          const style = { "--provider-color": color } as CSSProperties;
          return (
            <li
              key={`${p.id}-${i}`}
              style={style}
              className="provider-card group relative flex aspect-3/2 w-[calc(100cqw-2rem)] shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white p-8 shadow-[0_24px_62px_rgba(11,31,77,0.1)] ring-1 ring-mahalo-navy-900/5 backdrop-blur transition-shadow duration-300 hover:shadow-[0_30px_80px_rgba(11,31,77,0.18)] sm:w-[calc((100cqw-1.25rem)/2)] lg:w-[calc((100cqw-2.5rem)/3)]"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {p.logoUrl ? (
                <ProviderLogoImage
                  src={p.logoUrl}
                  alt={p.name}
                  className="max-h-20 w-auto max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                />
              ) : (
                <span
                  className="text-2xl font-bold tracking-tight"
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
