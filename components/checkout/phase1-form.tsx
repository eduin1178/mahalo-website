"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

import { ProviderLogoImage } from "@/components/providers/provider-logo-image";
import { finalizePlan } from "@/lib/orders/draft-actions";
import type { Plan, Provider } from "@/lib/db/schema";
import { fastestPlan, formatSpeed } from "@/lib/plans/speed";
import { cn } from "@/lib/utils";

export type Phase1ProviderEntry = {
  provider: Provider;
  plans: Plan[];
};

type Props = {
  entries: Phase1ProviderEntry[];
  initialPlanId: string | null;
};

type ChooseProps = {
  initialPlanId: string | null;
  pendingPlanId: string | null;
  disabled: boolean;
  onChoose: (planId: string) => void;
};

export function Phase1Form({ entries, initialPlanId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // In multi-provider mode, start collapsed — but pre-open the provider that
  // owns the already-chosen plan so the user sees their current selection.
  const initialOpen = useMemo(() => {
    const open = new Set<string>();
    if (initialPlanId) {
      const owner = entries.find((e) =>
        e.plans.some((p) => p.id === initialPlanId),
      );
      if (owner) open.add(owner.provider.id);
    }
    return open;
  }, [entries, initialPlanId]);
  const [openIds, setOpenIds] = useState<Set<string>>(initialOpen);

  function toggle(providerId: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  }

  function onChoose(planId: string) {
    setError(null);
    setPendingPlanId(planId);
    startTransition(async () => {
      // On success finalizePlan redirects to the next step; we only land back
      // here (clearing the pending state) when it returns an error.
      const result = await finalizePlan({ planId });
      if (result && !result.ok) {
        setError(result.error);
        setPendingPlanId(null);
      }
    });
  }

  const chooseProps: ChooseProps = {
    initialPlanId,
    pendingPlanId,
    disabled: pending,
    onChoose,
  };

  // Single provider → show its plans directly, no collapsed card. The plan
  // cards already carry the provider identity (logo / colored name).
  const singleProvider = entries.length === 1;

  return (
    <div className="flex flex-col gap-4">
      {singleProvider ? (
        <PlanGrid entry={entries[0]} {...chooseProps} />
      ) : (
        entries.map((entry) => (
          <ProviderAccordionCard
            key={entry.provider.id}
            entry={entry}
            open={openIds.has(entry.provider.id)}
            onToggle={() => toggle(entry.provider.id)}
            {...chooseProps}
          />
        ))
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function ProviderIdentity({ provider }: { provider: Provider }) {
  if (provider.logoUrl) {
    return (
      <ProviderLogoImage
        src={provider.logoUrl}
        alt={provider.name}
        className="max-h-9 w-auto object-contain"
      />
    );
  }
  return (
    <span
      className="rounded-md px-3 py-1.5 text-lg font-bold leading-tight"
      style={{
        color: provider.primaryColor,
        backgroundColor: `color-mix(in srgb, ${provider.primaryColor} 10%, transparent)`,
      }}
    >
      {provider.name}
    </span>
  );
}

function ProviderAccordionCard({
  entry,
  open,
  onToggle,
  ...chooseProps
}: {
  entry: Phase1ProviderEntry;
  open: boolean;
  onToggle: () => void;
} & ChooseProps) {
  const { provider, plans } = entry;
  const panelId = `provider-panel-${provider.id}`;

  // Teaser: cheapest autopay price + fastest plan's speed — no plan named.
  const cheapestAutopay = Math.min(...plans.map((p) => Number(p.priceAutopay)));
  const fastest = fastestPlan(plans);

  return (
    <div className="overflow-hidden rounded-3xl premium-light-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500 focus-visible:ring-inset md:p-6"
      >
        <span className="flex min-h-9 shrink-0 items-center">
          <ProviderIdentity provider={provider} />
        </span>

        <span className="ml-auto flex flex-col items-end text-right">
          <span className="text-sm font-semibold text-mahalo-navy-900 sm:text-base">
            From {formatPrice(cheapestAutopay)}/mo
          </span>
          {fastest ? (
            <span className="text-xs font-medium text-muted-foreground sm:text-sm">
              up to {formatSpeed(fastest.speedValue, fastest.speedUnit)}
            </span>
          ) : null}
        </span>

        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-mahalo-navy-900/60 transition-transform duration-300 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="border-t border-mahalo-navy-900/10 bg-white/30 p-5 md:p-6"
        >
          <PlanGrid entry={entry} {...chooseProps} />
        </div>
      ) : null}
    </div>
  );
}

function PlanGrid({
  entry,
  initialPlanId,
  pendingPlanId,
  disabled,
  onChoose,
}: { entry: Phase1ProviderEntry } & ChooseProps) {
  const { provider, plans } = entry;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanOption
          key={plan.id}
          provider={provider}
          plan={plan}
          current={plan.id === initialPlanId}
          pending={pendingPlanId === plan.id}
          disabled={disabled}
          onChoose={() => onChoose(plan.id)}
        />
      ))}
    </div>
  );
}

function PlanOption({
  provider,
  plan,
  current,
  pending,
  disabled,
  onChoose,
}: {
  provider: Provider;
  plan: Plan;
  current: boolean;
  pending: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const standard = Number(plan.priceStandard).toFixed(2);
  const autopay = Number(plan.priceAutopay).toFixed(2);
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <article
      className={cn(
        "group relative flex h-full min-h-90 flex-col overflow-hidden rounded-3xl premium-light-card transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_42px_110px_rgba(4,16,45,0.38)] focus-within:-translate-y-2 focus-within:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none",
        current && "ring-2 ring-mahalo-blue-600",
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
            {formatSpeed(plan.speedValue, plan.speedUnit)}
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
          onClick={onChoose}
          disabled={disabled}
          className={cn(
            "mt-auto w-full rounded-xl border-2 border-mahalo-navy-900 bg-mahalo-navy-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:border-mahalo-cyan-500 hover:bg-mahalo-navy-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
          )}
        >
          {pending ? "Saving…" : "Choose plan"}
        </button>
      </div>
    </article>
  );
}
