"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { selectPlan } from "@/lib/orders/draft-actions";
import type { Plan, Provider } from "@/lib/db/schema";

type Props = {
  provider: Provider;
  plan: Plan;
};

export function PlanCard({ provider, plan }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const standard = Number(plan.priceStandard).toFixed(2);
  const autopay = Number(plan.priceAutopay).toFixed(2);
  const features = Array.isArray(plan.features) ? plan.features : [];

  function handleSelect() {
    setError(null);
    startTransition(async () => {
      const result = await selectPlan({ planId: plan.id });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:shadow-md"
      style={{ borderTopColor: provider.primaryColor, borderTopWidth: 4 }}
    >
      <header className="flex items-center gap-3 border-b border-border/60 bg-surface px-5 py-4">
        <div className="flex h-10 w-24 items-center justify-start">
          {provider.logoUrl ? (
            <Image
              src={provider.logoUrl}
              alt={provider.name}
              width={120}
              height={40}
              className="max-h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-sm font-semibold text-mahalo-navy-900">
              {provider.name}
            </span>
          )}
        </div>
        <span className="ml-auto text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {provider.name}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-mahalo-navy-900">
            {plan.name}
          </h3>
          <p className="text-sm text-muted-foreground">{plan.speed}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-mahalo-navy-900">
            ${standard}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          ${autopay}/mo with autopay
        </p>

        {features.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm text-foreground">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1 inline-block size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: provider.primaryColor }}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            disabled={pending}
            onClick={handleSelect}
          >
            {pending ? "Selecting…" : "Select Plan"}
          </Button>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
