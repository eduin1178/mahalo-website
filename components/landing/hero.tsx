import { HeroSearch } from "./hero-search";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-mahalo-gradient-soft border-b border-border/40"
    >
      <WifiArcsDecoration />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 md:py-28">
        <span className="eyebrow">Mahalo Enterprise</span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-mahalo-navy-900 md:text-5xl lg:text-6xl">
          Find the right internet plan for your home.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Compare top providers in your area in seconds. Just enter your ZIP
          code or address — we&apos;ll handle the rest.
        </p>

        <HeroSearch />
      </div>
    </section>
  );
}

function WifiArcsDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 600"
      className="pointer-events-none absolute -right-24 -bottom-24 h-[480px] w-[480px] text-mahalo-blue-600 opacity-[0.07] md:-right-12 md:-bottom-16 md:h-[560px] md:w-[560px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinecap="round"
    >
      <circle cx="300" cy="500" r="36" fill="currentColor" stroke="none" />
      <path d="M170 420 Q300 290 430 420" />
      <path d="M110 380 Q300 170 490 380" />
      <path d="M50 340 Q300 50 550 340" />
    </svg>
  );
}
