"use client";

import { useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";

import { ProviderLogoImage } from "@/components/providers/provider-logo-image";
import { finalizeProvider } from "@/lib/orders/draft-actions";
import type { Plan, Provider } from "@/lib/db/schema";
import { fastestPlan, formatSpeed } from "@/lib/plans/speed";

export type ProviderSelectEntry = {
  provider: Provider;
  plans: Plan[];
};

type Props = {
  entries: ProviderSelectEntry[];
  initialProviderId: string | null;
};

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

export function ProviderSelectForm({ entries, initialProviderId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function onChoose(providerId: string) {
    setError(null);
    setPendingProviderId(providerId);
    startTransition(async () => {
      // On success finalizeProvider redirects to the Plan step; we only land
      // back here (clearing the pending state) when it returns an error.
      const result = await finalizeProvider({ providerId });
      if (result && !result.ok) {
        setError(result.error);
        setPendingProviderId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {entries.map(({ provider, plans }) => {
          const cheapestAutopay = Math.min(
            ...plans.map((p) => Number(p.priceAutopay)),
          );
          const fastest = fastestPlan(plans);
          const current = provider.id === initialProviderId;
          const isPending = pendingProviderId === provider.id;

          return (
            <li key={provider.id}>
              <button
                type="button"
                onClick={() => onChoose(provider.id)}
                disabled={pending}
                aria-current={current ? "true" : undefined}
                className={[
                  "flex w-full items-center gap-4 rounded-3xl premium-light-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mahalo-cyan-500 disabled:cursor-not-allowed disabled:opacity-60 md:p-6",
                  current ? "ring-2 ring-mahalo-blue-600" : "",
                ].join(" ")}
              >
                <span className="flex min-h-9 shrink-0 items-center">
                  <ProviderIdentity provider={provider} />
                </span>

                <span className="ml-auto flex flex-col items-end text-right">
                  {isPending ? (
                    <span className="text-sm font-semibold text-mahalo-navy-900">
                      Loading plans…
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-mahalo-navy-900 sm:text-base">
                        From {formatPrice(cheapestAutopay)}/mo
                      </span>
                      {fastest ? (
                        <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                          up to{" "}
                          {formatSpeed(fastest.speedValue, fastest.speedUnit)}
                        </span>
                      ) : null}
                    </>
                  )}
                </span>

                <ChevronRight
                  aria-hidden
                  className="size-5 shrink-0 text-mahalo-navy-900/60"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
