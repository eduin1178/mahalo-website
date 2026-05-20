import { listProviders } from "@/lib/providers/queries";

import { ProvidersCarousel } from "./providers-carousel";

export async function ProvidersGrid() {
  const all = await listProviders();
  const active = all.filter((p) => p.isActive);

  return (
    <section id="providers" className="relative overflow-hidden border-b border-border/40 bg-mahalo-providers-soft">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mahalo-cyan-500/50 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">Available providers</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          The networks we work with.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Coverage varies by ZIP. Run a search above and we&apos;ll show you
          exactly which of these are available at your address.
        </p>

        {active.length === 0 ? (
          <p className="mt-12 rounded-lg border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-muted-foreground">
            Providers haven&apos;t been configured yet. The admin team is
            getting things ready.
          </p>
        ) : (
          <ProvidersCarousel providers={active} />
        )}
      </div>
    </section>
  );
}
