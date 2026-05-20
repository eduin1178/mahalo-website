import { HeroSearch } from "./hero-search";

export function FinalCta() {
  return (
    <section
      id="final-cta"
      aria-label="Get started — check internet availability"
      className="bg-mahalo-cta"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center md:py-28">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Ready to find your plan?
        </h2>
        <p className="max-w-xl text-base text-white/75">
          Enter your ZIP code or address — we&apos;ll show you every provider
          available at your door in seconds.
        </p>
        <div className="w-full max-w-xl">
          <HeroSearch variant="final-cta" idSuffix="final-cta" />
        </div>
      </div>
    </section>
  );
}
