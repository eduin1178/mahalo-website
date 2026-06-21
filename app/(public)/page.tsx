import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MobileStickySearch } from "@/components/landing/mobile-sticky-search";
import { PlanHighlights } from "@/components/landing/plan-highlights";
import { ProvidersGrid } from "@/components/landing/providers-grid";
import { StatStrip } from "@/components/landing/stat-strip";
import { Testimonials } from "@/components/landing/testimonials";
import { WhyChooseUs } from "@/components/landing/why-choose-us";
import type { Provider } from "@/lib/db/schema";
import { listProviders } from "@/lib/providers/queries";

export const revalidate = 60;

async function safeListProviders(): Promise<Provider[]> {
  try {
    return await listProviders();
  } catch (err) {
    // Tolerate prerender-time DB unavailability (e.g. CI image build with no
    // DATABASE_URL). ISR will revalidate against the real DB at runtime.
    console.warn("HomePage: listProviders failed, falling back to empty list:", err);
    return [];
  }
}

export default async function HomePage() {
  const activeProviders = (await safeListProviders()).filter((p) => p.isActive);

  return (
    <>
      {/* Section order per design D2: lead with value, then reasons */}
      <Hero providers={activeProviders} />
      <StatStrip />
      <PlanHighlights />
      <HowItWorks />
      <ProvidersGrid />
      <WhyChooseUs />
      <Testimonials />
      <Faq />
      <FinalCta />

      {/* Client component — mobile only, sticky bottom bar */}
      <MobileStickySearch />
    </>
  );
}
