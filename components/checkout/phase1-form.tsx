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
      setError("Elige un plan para continuar.");
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5"
        >
          <div className="flex flex-col gap-1">
            <h2
              id="addons-heading"
              className="text-base font-semibold text-mahalo-navy-900"
            >
              Agrega extras de {selected.entry.provider.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Opcionales. Puedes saltar este paso.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
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
                            /mes
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
          disabled={pending || !selectedPlanId}
          onClick={onContinue}
        >
          {pending ? "Guardando…" : "Continuar"}
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
        "flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition",
        selected
          ? "border-mahalo-blue-600 ring-2 ring-mahalo-blue-600/30"
          : "border-border hover:shadow-md",
      )}
      style={
        selected
          ? undefined
          : { borderTopColor: provider.primaryColor, borderTopWidth: 4 }
      }
    >
      <header className="flex items-center gap-3 border-b border-border/60 bg-surface px-5 py-4">
        <div className="flex h-10 w-24 items-center justify-start">
          {provider.logoUrl ? (
            <ProviderLogoImage
              src={provider.logoUrl}
              alt={provider.name}
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
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          ${autopay}/mes con pago automático
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

        <div className="mt-auto pt-2">
          <Button
            type="button"
            variant={selected ? "primary" : "outline"}
            onClick={onSelect}
          >
            {selected ? "Plan elegido" : "Elegir plan"}
          </Button>
        </div>
      </div>
    </article>
  );
}
