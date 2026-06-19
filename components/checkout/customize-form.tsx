"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { finalizeAddOns } from "@/lib/orders/draft-actions";
import type { AddOn, Provider } from "@/lib/db/schema";

type Props = {
  provider: Provider;
  addOns: AddOn[];
  initialAddOnIds: string[];
};

export function CustomizeForm({ provider, addOns, initialAddOnIds }: Props) {
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialAddOnIds),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleAddOn(id: string) {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onContinue() {
    setError(null);
    const ids = Array.from(selectedAddOnIds);
    startTransition(async () => {
      const result = await finalizeAddOns({ addOnIds: ids });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="addons-heading"
        className="relative flex flex-col gap-4 overflow-hidden rounded-3xl premium-light-card p-6 md:p-7"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mahalo-cyan-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-1">
          <h2
            id="addons-heading"
            className="text-base font-semibold text-mahalo-navy-900"
          >
            Add {provider.name} extras
          </h2>
          <p className="text-sm text-muted-foreground">
            Optional. You can skip any you don’t need.
          </p>
        </div>
        <ul className="relative flex flex-col gap-3">
          {addOns.map((addOn) => {
            const checked = selectedAddOnIds.has(addOn.id);
            const price = Number(addOn.price).toFixed(2);
            return (
              <li key={addOn.id}>
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:bg-surface"
                  style={
                    checked
                      ? {
                          borderColor: provider.primaryColor,
                          boxShadow: `0 0 0 1px ${provider.primaryColor}`,
                        }
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 cursor-pointer accent-mahalo-blue-600"
                    checked={checked}
                    onChange={() => toggleAddOn(addOn.id)}
                    disabled={pending}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-mahalo-navy-900">
                        {addOn.name}
                      </span>
                      <span className="text-sm font-semibold text-mahalo-navy-900">
                        ${price}
                        <span className="text-xs font-normal text-muted-foreground">
                          /mo
                        </span>
                      </span>
                    </div>
                    {addOn.description ? (
                      <p className="text-xs text-muted-foreground">
                        {addOn.description}
                      </p>
                    ) : null}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="h-12 w-full rounded-xl px-10 text-base font-semibold sm:w-auto"
          disabled={pending}
          onClick={onContinue}
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
