import Image from "next/image";

import { listProviders } from "@/lib/providers/queries";
import type { Provider } from "@/lib/db/schema";

import { ProvidersCarousel } from "./providers-carousel";

async function safeListProviders(): Promise<Provider[]> {
  try {
    return await listProviders();
  } catch (err) {
    // Tolerate prerender-time DB unavailability (e.g. CI image build with no
    // DATABASE_URL). ISR will revalidate against the real DB at runtime.
    console.warn("ProvidersGrid: listProviders failed, falling back to empty list:", err);
    return [];
  }
}

export async function ProvidersGrid() {
  const all = await safeListProviders();
  const active = all.filter((p) => p.isActive);

  return (
    <section id="providers" className="relative isolate overflow-hidden border-b border-border/40">
      {/* Background image — dark tech backdrop behind the provider carousel */}
      <Image
        src="/hero/providers.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      {/* Navy overlay so the headings and copy stay legible on the artwork */}
      <div
        className="absolute inset-0 -z-10 bg-mahalo-navy-900/65"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-mahalo-cyan-500/50 to-transparent" aria-hidden="true" />

      {/* Heading block stays in the centered column */}
      <div className="mx-auto max-w-6xl px-6 pt-20 md:pt-28">
        <span className="eyebrow text-mahalo-cyan-300">Available providers</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
          The networks we work with.
        </h2>
        <p className="mt-3 max-w-2xl text-white/85">
          Coverage varies by ZIP. Run a search above and we&apos;ll show you
          exactly which of these are available in your area.
        </p>
      </div>

      {/* Carousel runs full-bleed so the motion feels intentional and impactful */}
      {active.length === 0 ? (
        <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
          <p className="mt-12 rounded-lg border border-dashed border-white/30 bg-white/10 px-6 py-10 text-center text-sm text-white/80 backdrop-blur-sm">
            Providers haven&apos;t been configured yet. The admin team is
            getting things ready.
          </p>
        </div>
      ) : (
        <div className="mt-12 pb-20 md:pb-28">
          <ProvidersCarousel providers={active} />
        </div>
      )}
    </section>
  );
}
