import { ShieldCheckIcon, ZapIcon, HeartHandshakeIcon, MapPinIcon } from "lucide-react";

const items = [
  {
    icon: MapPinIcon,
    title: "Coverage you can trust",
    description:
      "We map your address against every major provider so you only see plans that actually reach your home.",
  },
  {
    icon: ZapIcon,
    title: "Fast, transparent quotes",
    description:
      "Compare speeds, prices and add-ons side by side — no surprises, no hidden fees buried in fine print.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "A real person to help",
    description:
      "After you submit, an agent calls to verify the details and walks you through the installation — no chatbots.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Your data stays safe",
    description:
      "We share only what the provider needs to set up service. Sensitive details like SSN are confirmed by phone.",
  },
];

export function WhyChooseUs() {
  return (
    <section id="why" className="border-b border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="eyebrow">Why Mahalo</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
          A simpler way to pick your home internet.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          We work with the country&apos;s top providers so you don&apos;t have
          to call each one. One search, every option in your area.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              <div className="glow-cyan-sm flex h-11 w-11 items-center justify-center rounded-full bg-mahalo-cyan-300/20 text-mahalo-blue-600">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-mahalo-navy-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
