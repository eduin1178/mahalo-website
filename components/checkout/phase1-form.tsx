"use client";

import { useMemo, useState, useTransition } from "react";

import { ProviderLogoImage } from "@/components/providers/provider-logo-image";
import { Button } from "@/components/ui/button";
import { finalizePhase1 } from "@/lib/orders/draft-actions";
import type { AddOn, Plan, Provider } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export type Phase1ProviderEntry = {
  provider: Provider;
  plans: Plan[];
  addOns: AddOn[];
};

type Props = {
  entries: Phase1ProviderEntry[];
  initialPlanId: string | null;
  initialAddOnIds: string[];
};

export function Phase1Form({
  entries,
  initialPlanId,
  initialAddOnIds,
}: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialPlanId,
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialAddOnIds),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const planLookup = useMemo(() => {
    const map = new Map<string, { plan: Plan; entry: Phase1ProviderEntry }>();
    for (const entry of entries) {
      for (const plan of entry.plans) {
        map.set(plan.id, { plan, entry });
      }
    }
    return map;
  }, [entries]);

  const selected = selectedPlanId ? planLookup.get(selectedPlanId) : undefined;
  const availableAddOns = selected?.entry.addOns ?? [];

  function chooseplan(planId: string) {
    setError(null);
    if (planId === selectedPlanId) return;
    setSelectedPlanId(planId);
    setSelectedAddOnIds(new Set());
  }

  function toggleAddOn(id: string) {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onContinue() {
    if (!selectedPlanId) {
      setError("Choose a plan to continue.");
      return;
    }
    setError(null);
    const ids = Array.from(selectedAddOnIds);
    startTransition(async () => {
      const result = await finalizePhase1({
        planId: selectedPlanId,
        addOnIds: ids,
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {entries.map(({ provider, plans }) => (
        <section
          key={provider.id}
          aria-labelledby={`provider-${provider.id}`}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: provider.primaryColor }}
            />
            <h2
              id={`provider-${provider.id}`}
              className="text-base font-semibold text-mahalo-navy-900"
            >
              {provider.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <PlanOption
                key={plan.id}
                provider={provider}
                plan={plan}
                selected={selectedPlanId === plan.id}
                onSelect={() => chooseplan(plan.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {selected && availableAddOns.length > 0 ? (
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
              Add {selected.entry.provider.name} extras
            </h2>
            <p className="text-sm text-muted-foreground">
              Optional. You can skip this step.
            </p>
          </div>
          <ul className="relative flex flex-col gap-3">
            {availableAddOns.map((addOn) => {
              const checked = selectedAddOnIds.has(addOn.id);
              const price = Number(addOn.price).toFixed(2);
              return (
                <li key={addOn.id}>
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:bg-surface"
                    style={
                      checked
                        ? {
                            borderColor: selected.entry.provider.primaryColor,
                            boxShadow: `0 0 0 1px ${selected.entry.provider.primaryColor}`,
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
      ) : null}

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
          disabled={pending || !selectedPlanId}
          onClick={onContinue}
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function PlanOption({
  provider,
  plan,
  selected,
  onSelect,
}: {
  provider: Provider;
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const standard = Number(plan.priceStandard).toFixed(2);
  const autopay = Number(plan.priceAutopay).toFixed(2);
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <article
      className={cn(
        "group relative flex h-full min-h-90 flex-col overflow-hidden rounded-3xl premium-light-card transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_42px_110px_rgba(4,16,45,0.38)] focus-within:-translate-y-2 focus-within:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none",
        selected && "ring-2 ring-mahalo-blue-600",
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mahalo-cyan-500/15 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex flex-1 flex-col gap-5 p-6 md:p-7">
        <div className="flex min-h-10 items-center">
          {provider.logoUrl ? (
            <ProviderLogoImage
              src={provider.logoUrl}
              alt={provider.name}
              className="max-h-10 w-auto object-contain"
            />
          ) : (
            <span
              className="rounded-md px-3 py-1.5 text-xl font-bold leading-tight"
              style={{
                color: provider.primaryColor,
                backgroundColor: `color-mix(in srgb, ${provider.primaryColor} 10%, transparent)`,
              }}
            >
              {provider.name}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-mahalo-navy-900">
            {plan.name}
          </h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {plan.speed}
          </p>
        </div>

        <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-mahalo-navy-900/10">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold tracking-tight text-mahalo-navy-900">
              ${autopay}
            </span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">
              /mo with autopay
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            ${standard}/mo standard rate.
          </p>
        </div>

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

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={cn(
            "mt-auto w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500 focus-visible:ring-offset-2 motion-reduce:transition-none",
            selected
              ? "border-mahalo-navy-900 bg-white text-mahalo-navy-900 hover:bg-surface"
              : "border-mahalo-navy-900 bg-mahalo-navy-900 text-white hover:border-mahalo-cyan-500 hover:bg-mahalo-navy-700 hover:shadow-lg",
          )}
        >
          {selected ? "Plan selected" : "Choose plan"}
        </button>
      </div>
    </article>
  );
}
