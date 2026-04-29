import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProvidersGrid } from "@/components/landing/providers-grid";
import { Testimonials } from "@/components/landing/testimonials";
import { WhyChooseUs } from "@/components/landing/why-choose-us";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <ProvidersGrid />
      <HowItWorks />
      <Faq />
      <Testimonials />
    </>
  );
}
