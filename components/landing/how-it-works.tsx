"use client";

import { useState } from "react";

const steps = [
  {
    n: 1,
    title: "Tell us where you live",
    description:
      "Enter your ZIP or full address. We check every provider that covers your home.",
    emphasized: false,
    image: "/landing/steps/step-1.png",
    imageAlt: "Home address lookup moment for checking internet availability",
  },
  {
    n: 2,
    title: "Pick a plan",
    description:
      "Compare speeds, prices and add-ons side by side. Choose what fits your household.",
    emphasized: false,
    image: "/landing/steps/setp-2.png",
    imageAlt: "Plan comparison moment for selecting the right internet option",
  },
  {
    n: 3,
    title: "A real person calls you - no chatbots",
    description:
      "An agent confirms the details, schedules your install, and gets you online. Humans only.",
    emphasized: true,
    image: "/landing/steps/setp-3.png",
    imageAlt: "Human follow-up moment with a real person confirming service details",
  },
] as const;

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const active = steps[activeStep];

  return (
    <section id="how" className="overflow-hidden border-b border-border/40 bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <span className="eyebrow">How it works</span>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-mahalo-navy-900 md:text-4xl">
            From search to installed in three steps.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Mahalo turns the messy provider-shopping process into one guided flow:
            address, comparison, then a real human confirmation.
          </p>

          <ol className="mt-10 space-y-5">
            {steps.map((s, index) => {
              const isActive = activeStep === index;
              return (
                <li key={s.n} className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveStep(index)}
                    onFocus={() => setActiveStep(index)}
                    className={[
                      "w-full rounded-3xl p-5 text-left transition-all duration-300 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500 focus-visible:ring-offset-2",
                      isActive
                        ? "border border-mahalo-cyan-500/40 bg-mahalo-cyan-500/8 shadow-[0_22px_54px_rgba(11,31,77,0.12)]"
                        : "border border-border bg-white shadow-sm hover:border-mahalo-cyan-500/30 hover:shadow-md",
                      s.emphasized && "ring-1 ring-mahalo-cyan-500/20",
                    ].filter(Boolean).join(" ")}
                    aria-describedby={`how-step-${s.n}-description`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={
                          s.emphasized || isActive
                            ? "glow-cyan flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mahalo-navy-900 text-xl font-bold text-white shadow-md ring-2 ring-mahalo-cyan-500/40"
                            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mahalo-navy-900 text-base font-semibold text-white shadow-md"
                        }
                      >
                        {s.n}
                      </div>
                      <div>
                        <h3
                          className={
                            s.emphasized || isActive
                              ? "text-xl font-bold text-mahalo-navy-900"
                              : "text-lg font-semibold text-mahalo-navy-900"
                          }
                        >
                          {s.title}
                        </h3>
                        <p
                          id={`how-step-${s.n}-description`}
                          className="mt-2 text-sm leading-6 text-muted-foreground"
                        >
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative mx-auto w-full max-w-[470px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-700 motion-reduce:animate-none lg:mr-0">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-mahalo-gradient-soft blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2rem] border border-mahalo-navy-900/10 bg-white p-3 shadow-[0_30px_80px_rgba(11,31,77,0.16)]">
            <div
              role="img"
              aria-label={active.imageAlt}
              className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-cover bg-center transition-all duration-500 motion-reduce:transition-none"
              style={{ backgroundImage: `url(${active.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-mahalo-navy-900/82 via-mahalo-navy-900/28 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mahalo-cyan-300">
                  Step {active.n}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {active.title}
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                  {active.description}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 left-1/2 w-[min(90%,24rem)] -translate-x-1/2 rounded-2xl bg-mahalo-navy-900 px-5 py-4 text-center text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10">
            Hover a step to preview the moment in the journey.
          </div>
        </div>
      </div>
    </section>
  );
}
