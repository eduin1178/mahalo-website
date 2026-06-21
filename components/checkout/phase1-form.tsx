"use client";

import { useState, useTransition } from "react";

import { ConsentDisclaimerModal } from "@/components/checkout/consent-disclaimer-modal";
import { ProviderLogoImage } from "@/components/providers/provider-logo-image";
import { finalizePlan } from "@/lib/orders/draft-actions";
import type { Plan, Provider } from "@/lib/db/schema";
import { formatSpeed } from "@/lib/plans/speed";
import { cn } from "@/lib/utils";

export type Phase1ProviderEntry = {
  provider: Provider;
  plans: Plan[];
};

type Props = {
  entry: Phase1ProviderEntry;
  initialPlanId: string | null;
  // When the provider has add-ons, the consent disclaimer gates the Customize
  // step instead, so the plan cards advance directly. Otherwise the disclaimer
  // modal gates the "Choose plan" action here.
  providerHasAddOns: boolean;
};

export function Phase1Form({ entry, initialPlanId, providerHasAddOns }: Props) {
  const { provider, plans } = entry;
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [consentPlanId, setConsentPlanId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(planId: string) {
    setError(null);
    setPendingPlanId(planId);
    startTransition(async () => {
      // On success finalizePlan redirects to the next step; we only land back
      // here (clearing the pending state) when it returns an error.
      const result = await finalizePlan({ planId });
      if (result && !result.ok) {
        setError(result.error);
        setPendingPlanId(null);
        setConsentPlanId(null);
      }
    });
  }

  function onChoose(planId: string) {
    if (providerHasAddOns) {
      // Disclaimer lives on the Customize step; advance directly.
      choose(planId);
    } else {
      // Gate the advance behind the mandatory consent modal.
      setConsentPlanId(planId);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanOption
            key={plan.id}
            provider={provider}
            plan={plan}
            current={plan.id === initialPlanId}
            pending={pendingPlanId === plan.id}
            disabled={pending}
            gated={!providerHasAddOns}
            onChoose={() => onChoose(plan.id)}
          />
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ConsentDisclaimerModal
        open={consentPlanId !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setConsentPlanId(null);
        }}
        providerName={provider.name}
        pending={pending}
        onContinue={() => {
          if (consentPlanId) choose(consentPlanId);
        }}
      />
    </div>
  );
}

function PlanOption({
  provider,
  plan,
  current,
  pending,
  disabled,
  gated,
  onChoose,
}: {
  provider: Provider;
  plan: Plan;
  current: boolean;
  pending: boolean;
  disabled: boolean;
  gated: boolean;
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
          title={gated ? "Click for details" : undefined}
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
