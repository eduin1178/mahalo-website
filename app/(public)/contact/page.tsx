import { ContactForm } from "@/components/contact/contact-form";

export const metadata = {
  title: "Contact Us",
  description:
    "Have a question about internet plans in your area? Send us a message and a real person will get back to you.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
          Get in touch
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-mahalo-navy-900">
          Contact Us
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tell us what you need and a real person will help you find the right
          internet plan for your address. No chatbots.
        </p>
      </div>

      <ContactForm />
    </section>
  );
}
