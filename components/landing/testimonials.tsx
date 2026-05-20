// PLACEHOLDER: replace avatar initials, ratings, and quotes with client-approved data — see follow-up change
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
      "I was dreading shopping for internet. Mahalo made it the easiest part of moving — no calls to support lines, no upsells.",
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
          className={i < rating ? "text-amber-400" : "text-border"}
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
    <section id="testimonials" className="border-b border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">What customers say</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          Trusted by households across the country.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              {/* Avatar + rating row */}
              <div className="flex items-center gap-3">
                {/* Initial avatar fallback */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mahalo-navy-900 text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-mahalo-navy-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
                <div className="ml-auto">
                  <StarRating rating={t.rating} />
                </div>
              </div>

              <blockquote className="mt-4 flex-1 text-base leading-7 text-mahalo-navy-900">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
