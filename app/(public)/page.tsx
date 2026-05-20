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

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      {/* Section order per design D2: lead with value, then reasons */}
      <Hero />
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
