"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Step = { id: number; label: string; path: string };

const STEPS: readonly Step[] = [
  { id: 1, label: "Address", path: "/checkout" },
  { id: 2, label: "Plan", path: "/checkout/plan" },
  { id: 3, label: "Add-ons", path: "/checkout/add-ons" },
  { id: 4, label: "Summary", path: "/checkout/summary" },
  { id: 5, label: "Customer", path: "/checkout/customer" },
  { id: 6, label: "Payment", path: "/checkout/payment" },
  { id: 7, label: "Schedule", path: "/checkout/schedule" },
  { id: 8, label: "Confirm", path: "/checkout/confirmation" },
];

function resolveCurrentStepId(pathname: string | null): number {
  if (!pathname) return 1;
  let best = STEPS[0];
  for (const step of STEPS) {
    if (pathname === step.path && step.path.length >= best.path.length) {
      best = step;
    } else if (
      step.path !== "/checkout" &&
      pathname.startsWith(`${step.path}/`) &&
      step.path.length >= best.path.length
    ) {
      best = step;
    }
  }
  return best.id;
}

export function CheckoutStepper() {
  const pathname = usePathname();
  const currentId = resolveCurrentStepId(pathname);

  return (
    <ol
      aria-label="Checkout progress"
      className="flex items-center gap-1 overflow-x-auto pb-2 text-xs sm:gap-2 sm:text-sm"
    >
      {STEPS.map((step, i) => {
        const state =
          step.id < currentId ? "done" : step.id === currentId ? "active" : "todo";
        return (
          <li key={step.id} className="flex shrink-0 items-center gap-2">
            <span
              aria-current={state === "active" ? "step" : undefined}
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold sm:size-7 sm:text-xs",
                state === "done" &&
                  "border-mahalo-blue-600 bg-mahalo-blue-600 text-white",
                state === "active" &&
                  "border-mahalo-navy-900 bg-mahalo-navy-900 text-white",
                state === "todo" && "border-border text-muted-foreground",
              )}
            >
              {step.id}
            </span>
            <span
              className={cn(
                "hidden whitespace-nowrap sm:inline",
                state === "active"
                  ? "font-medium text-mahalo-navy-900"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-3 bg-border sm:w-6" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
