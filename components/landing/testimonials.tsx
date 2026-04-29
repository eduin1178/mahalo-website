import { QuoteIcon } from "lucide-react";

const testimonials = [
  {
    quote:
      "I had three providers to compare in under a minute. Picked the plan, the agent called the next morning, technician was here that week.",
    name: "Sarah M.",
    location: "Tampa, FL",
  },
  {
    quote:
      "I was dreading shopping for internet. Mahalo made it the easiest part of moving — no calls to support lines, no upsells.",
    name: "James R.",
    location: "Charlotte, NC",
  },
  {
    quote:
      "Honest pricing and a real person walking me through autopay vs standard rates. That alone saved me money.",
    name: "Priya S.",
    location: "Austin, TX",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">What customers say</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          Trusted by households across the country.
        </h2>
        {/* TODO: replace placeholder testimonials with client-approved quotes. */}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              <QuoteIcon
                className="h-6 w-6 text-mahalo-blue-600"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <blockquote className="mt-4 flex-1 text-base leading-7 text-mahalo-navy-900">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold text-mahalo-navy-900">
                  {t.name}
                </span>
                <span className="text-muted-foreground"> · {t.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
