"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const HIDDEN_PATHS = new Set<string>([
  "/checkout",
  "/checkout/confirmation",
]);

export function OrderTotalPanelClient({
  body,
  summary,
}: {
  body: ReactNode;
  summary: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!pathname || HIDDEN_PATHS.has(pathname)) return null;
  if (!pathname.startsWith("/checkout")) return null;

  return (
    <>
      <aside
        aria-label="Order summary"
        className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
      >
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Summary
          </h2>
          {body}
        </div>
      </aside>

      <div className="lg:hidden">
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.05)]",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="order-total-mobile-body"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Summary
              </span>
              {summary}
            </span>
            <span
              aria-hidden
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full border border-border text-mahalo-navy-900 transition-transform",
                open && "rotate-180",
              )}
            >
              ▾
            </span>
          </button>
          <div
            id="order-total-mobile-body"
            hidden={!open}
            className="border-t border-border px-4 py-4 max-h-[60vh] overflow-y-auto"
          >
            {body}
          </div>
        </div>
      </div>
    </>
  );
}
