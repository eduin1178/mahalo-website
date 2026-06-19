"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Phase = {
  id: number;
  label: string;
  href: string;
  matches: (path: string) => boolean;
};

const PHASES: readonly Phase[] = [
  {
    id: 1,
    label: "Plan",
    href: "/checkout/plan",
    matches: (p) => p === "/checkout/plan" || p.startsWith("/checkout/plan/"),
  },
  {
    id: 2,
    label: "Customize",
    href: "/checkout/customize",
    matches: (p) =>
      p === "/checkout/customize" || p.startsWith("/checkout/customize/"),
  },
  {
    id: 3,
    label: "Details",
    href: "/checkout/details",
    matches: (p) =>
      p === "/checkout/details" || p.startsWith("/checkout/details/"),
  },
  {
    id: 4,
    label: "Installation",
    href: "/checkout/schedule",
    matches: (p) =>
      p === "/checkout/schedule" || p.startsWith("/checkout/schedule/"),
  },
];

const HIDDEN_ON: readonly string[] = ["/checkout", "/checkout/confirmation"];

function resolveCurrentPhaseId(pathname: string | null): number | null {
  if (!pathname) return null;
  if (HIDDEN_ON.includes(pathname)) return null;
  for (const phase of PHASES) {
    if (phase.matches(pathname)) return phase.id;
  }
  return null;
}

export function CheckoutStepper() {
  const pathname = usePathname();
  const currentId = resolveCurrentPhaseId(pathname);

  if (currentId === null) return null;

  return (
    <ol
      aria-label="Order progress"
      className="flex items-center gap-2 pb-2 text-xs sm:gap-3 sm:text-sm"
    >
      {PHASES.map((phase, i) => {
        const state =
          phase.id < currentId
            ? "done"
            : phase.id === currentId
              ? "active"
              : "todo";

        const circle = (
          <span
            aria-current={state === "active" ? "step" : undefined}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:size-8 sm:text-sm",
              state === "done" &&
                "border-mahalo-blue-600 bg-mahalo-blue-600 text-white",
              state === "active" &&
                "border-mahalo-navy-900 bg-mahalo-navy-900 text-white",
              state === "todo" && "border-border text-muted-foreground",
            )}
          >
            {phase.id}
          </span>
        );

        const label = (
          <span
            className={cn(
              "whitespace-nowrap",
              state === "active"
                ? "font-semibold text-mahalo-navy-900"
                : "text-muted-foreground",
            )}
          >
            {phase.label}
          </span>
        );

        return (
          <li key={phase.id} className="flex flex-1 items-center gap-2">
            {state === "done" ? (
              <Link
                href={phase.href}
                aria-label={`Go back to step ${phase.id}: ${phase.label}`}
                className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-blue-600/40 focus-visible:ring-offset-2"
              >
                {circle}
                {label}
              </Link>
            ) : (
              <span className="flex items-center gap-2">
                {circle}
                {label}
              </span>
            )}
            {i < PHASES.length - 1 && (
              <span aria-hidden className="ml-2 h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
