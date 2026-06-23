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
              className="provider-card group relative flex aspect-[2/1] w-[calc(100cqw-2rem)] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-white p-5 shadow-sm ring-1 ring-mahalo-navy-900/5 backdrop-blur transition-shadow duration-300 hover:shadow-md sm:w-[calc((100cqw-1.25rem)/2)] lg:w-[calc((100cqw-2.5rem)/3)]"
            >
              {p.logoUrl ? (
                <ProviderLogoImage
                  src={p.logoUrl}
                  alt={p.name}
                  className="max-h-12 w-auto max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
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
