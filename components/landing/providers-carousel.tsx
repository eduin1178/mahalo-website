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
              className="provider-card group relative flex aspect-3/4 w-[calc(100cqw-2rem)] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_24px_62px_rgba(11,31,77,0.1)] ring-1 ring-mahalo-navy-900/5 backdrop-blur transition-shadow duration-300 hover:shadow-[0_30px_80px_rgba(11,31,77,0.18)] sm:w-[calc((100cqw-1.25rem)/2)] lg:w-[calc((100cqw-2.5rem)/3)]"
            >
              {p.logoUrl ? (
                <ProviderLogoImage
                  src={p.logoUrl}
                  alt={p.name}
                  className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                >
                  <span className="text-3xl font-bold text-white">{p.name}</span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/45 to-transparent px-5 pb-5 pt-12">
                <div
                  className="mb-2 h-px w-10"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <p className="truncate text-base font-semibold tracking-tight text-white drop-shadow-sm">
                  {p.name}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
