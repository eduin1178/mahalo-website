import Image from "next/image";

import { listProviders } from "@/lib/providers/queries";

export async function ProvidersGrid() {
  const all = await listProviders();
  const active = all.filter((p) => p.isActive);

  return (
    <section id="providers" className="border-b border-border/40 bg-surface">
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
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {active.map((p) => (
              // Always-on top border removed per design D1/7.1.
              // Brand color revealed on hover via CSS custom property + ::before overlay.
              <li
                key={p.id}
                className="group relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-background px-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Hover top-border: brand color revealed on hover only */}
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                  style={{ backgroundColor: p.primaryColor ?? "#2a5bc7" }}
                  aria-hidden="true"
                />
                {p.logoUrl ? (
                  <Image
                    src={p.logoUrl}
                    alt={p.name}
                    width={140}
                    height={48}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-base font-semibold text-mahalo-navy-900">
                    {p.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
