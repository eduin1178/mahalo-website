// PLACEHOLDER: replace with real data — see follow-up change (lib/stats/queries)
const STATS = [
  { value: "12+", label: "Providers", description: "12 or more internet providers" },
  { value: "4.8★", label: "1,200+ reviews", description: "4.8 stars from over 1,200 customer reviews" },
  { value: "15,000+", label: "Households connected", description: "Over 15,000 households connected" },
  { value: "30 sec", label: "Avg. match time", description: "Average 30 seconds to match a plan" },
] as const;

export function StatStrip() {
  return (
    <section
      id="stat-strip"
      aria-label="Mahalo by the numbers"
      className="border-b border-border/40 bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <dt className="sr-only">{stat.description}</dt>
              <dd
                aria-label={stat.description}
                className="text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl"
              >
                {stat.value}
              </dd>
              <span
                aria-hidden="true"
                className="mt-1.5 text-sm font-medium text-muted-foreground"
              >
                {stat.label}
              </span>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
