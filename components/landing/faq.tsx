import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is Mahalo Enterprise an internet provider?",
    a: "No. We're an authorized dealer that helps you compare and sign up for service from the major providers in your area. The provider you choose handles billing, installation and support directly.",
  },
  {
    q: "Do I pay anything to use Mahalo?",
    a: "No, our service is to help you navigate the diAerent programs that are available for you. Internet fees will be billed directly to you from the provider.",
  },
  {
    q: "What happens after I submit my order?",
    a: "An agent calls you within one business day to verify a few personal details (like SSN and date of birth) that are required to open the account with the provider. Then we register the order on your behalf.",
  },
  {
    q: "When will my internet be installed?",
    a: "You pick the best install time provided during your consultation and ordering process phone call. Once the appointment is confirmed by the provider, you will receive confirmation for the technician’s arrival time. ",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes. Plan changes, upgrades, and cancellations are typically handled directly by your provider once your account is active. We recommend checking with your provider for specific options and policies regarding your service. If you'd like to compare providers or switch services in the future, we're happy to help—just run a new search."
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-border/40 bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <span className="eyebrow">Frequently asked</span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          Questions, answered.
        </h2>
        <p className="mt-3 text-muted-foreground">
          {/* TODO: replace placeholder content with client-approved copy. */}
          Don&apos;t see what you&apos;re looking for? Reach out and we&apos;ll
          get back to you.
        </p>

        <Accordion className="mt-10">
          {faqs.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-base text-mahalo-navy-900">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
