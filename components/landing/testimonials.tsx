// PLACEHOLDER: replace avatar initials, ratings, and quotes with client-approved data - see follow-up change
const testimonials = [
  {
    quote:
      "I had three providers to compare in under a minute. Picked the plan, the agent called the next morning, technician was here that week.",
    name: "Sarah M.",
    location: "Tampa, FL",
    initial: "S",
    rating: 5,
  },
  {
    quote:
      "I was dreading shopping for internet. Mahalo made it the easiest part of moving - no calls to support lines, no upsells.",
    name: "James R.",
    location: "Charlotte, NC",
    initial: "J",
    rating: 5,
  },
  {
    quote:
      "Honest pricing and a real person walking me through autopay vs standard rates. That alone saved me money.",
    name: "Priya S.",
    location: "Austin, TX",
    initial: "P",
    rating: 5,
  },
];

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of ${max} stars`}
      role="img"
    >
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={i < rating ? "text-amber-400 drop-shadow-sm" : "text-mahalo-navy-900/15"}
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative isolate overflow-hidden border-b border-border/40 bg-mahalo-testimonials-inverse"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mahalo-cyan-500/50 to-transparent" aria-hidden="true" />
      <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-mahalo-cyan-500/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-28 bottom-12 h-72 w-72 rounded-full bg-mahalo-blue-600/15 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">What customers say</span>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
            Trusted by households across the country.
          </h2>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Calm proof before the final CTA: real people, clear options, and no chatbot runaround.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <figure
              key={t.name}
              className="group flex h-full flex-col rounded-3xl trust-card-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_76px_rgba(11,31,77,0.16)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-reduce:animate-none motion-reduce:transform-none motion-reduce:transition-none"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="glow-cyan-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mahalo-navy-900 text-sm font-bold text-white shadow-md"
                  aria-hidden="true"
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-mahalo-navy-900">
                    {t.name}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">{t.location}</p>
                </div>
              </div>

              <div className="mt-5">
                <StarRating rating={t.rating} />
              </div>

              <blockquote className="mt-4 flex-1 text-base leading-7 text-mahalo-navy-900">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-6 h-px bg-gradient-to-r from-mahalo-cyan-500/40 via-mahalo-navy-900/10 to-transparent" aria-hidden="true" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

