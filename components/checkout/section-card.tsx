import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const SECTION_CARD_CLASS =
  "relative overflow-hidden rounded-3xl premium-light-card p-6 md:p-7 scroll-mt-24";

function SectionDecor() {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mahalo-cyan-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent"
        aria-hidden="true"
      />
    </>
  );
}

/**
 * Shared premium card surface for checkout form sections (Phases 2 and 3).
 * Renders the `premium-light-card` surface with decorative accents and places
 * content on a `relative` layer above them. No hover-lift — this is a form
 * container, not a selectable card.
 */
export function SectionCard({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(SECTION_CARD_CLASS, className)}
    >
      <SectionDecor />
      <div className="relative flex flex-col gap-4">{children}</div>
    </section>
  );
}
