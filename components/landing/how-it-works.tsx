const steps = [
  {
    n: 1,
    title: "Tell us where you live",
    description:
      "Enter your ZIP or full address. We check every provider that covers your home.",
    emphasized: false,
  },
  {
    n: 2,
    title: "Pick a plan",
    description:
      "Compare speeds, prices and add-ons side by side. Choose what fits your household.",
    emphasized: false,
  },
  {
    n: 3,
    // Tightened to lead with the human-agent differentiator
    title: "A real person calls you — no chatbots",
    description:
      "An agent confirms the details, schedules your install, and gets you online. Humans only.",
    emphasized: true,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">How it works</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          From search to installed in three steps.
        </h2>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="relative">
              {/* Step 3 gets larger number bubble + cyan glow to signal the human-agent differentiator */}
              <div
                className={
                  s.emphasized
                    ? "glow-cyan flex h-16 w-16 items-center justify-center rounded-full bg-mahalo-navy-900 text-xl font-bold text-white shadow-md ring-2 ring-mahalo-cyan-500/40"
                    : "flex h-12 w-12 items-center justify-center rounded-full bg-mahalo-navy-900 text-lg font-semibold text-white shadow-md"
                }
              >
                {s.n}
              </div>
              <h3
                className={
                  s.emphasized
                    ? "mt-5 text-xl font-bold text-mahalo-navy-900"
                    : "mt-5 text-lg font-semibold text-mahalo-navy-900"
                }
              >
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {s.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
