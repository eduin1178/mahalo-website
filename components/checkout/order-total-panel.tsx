import "server-only";

import { eq } from "drizzle-orm";

import { OrderTotalPanelClient } from "@/components/checkout/order-total-panel-client";
import { getDb } from "@/lib/db/client";
import { providers, type Provider } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";
import {
  calculateTotal,
  formatUsd,
  type TotalBreakdown,
} from "@/lib/orders/totals";
import { formatSpeed } from "@/lib/plans/speed";
import { cn } from "@/lib/utils";

export async function OrderTotalPanel() {
  const draft = await getCurrentDraft();

  const breakdown =
    draft && draft.providerId && draft.planId
      ? await calculateTotal(draft, draft.autopayEnabled ?? false)
      : null;

  let provider: Provider | null = null;
  if (draft?.providerId) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, draft.providerId))
      .limit(1);
    provider = row ?? null;
  }

  const body = breakdown ? (
    renderBody(breakdown, provider)
  ) : (
    <p className="text-sm text-muted-foreground">
      Choose a plan to see the total.
    </p>
  );

  const summary = breakdown ? (
    <span className="font-semibold text-mahalo-navy-900">
      {formatUsd(breakdown.monthlyTotal)}
      <span className="text-xs font-normal text-muted-foreground"> /mo</span>
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Choose a plan</span>
  );

  return <OrderTotalPanelClient body={body} summary={summary} />;
}

function renderBody(breakdown: TotalBreakdown, provider: Provider | null) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Plan
        </span>
        <span className="font-medium text-mahalo-navy-900">
          {provider ? `${provider.name} · ` : ""}
          {breakdown.plan.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatSpeed(breakdown.plan.speedValue, breakdown.plan.speedUnit)}
        </span>
      </div>

      <dl className="flex flex-col gap-2 border-t border-border pt-3">
        <Row
          label="Plan"
          value={formatUsd(breakdown.planPriceStandard) + " /mo"}
        />
        {breakdown.addOns.length > 0 ? (
          breakdown.addOns.map((a) => (
            <Row
              key={a.id}
              label={a.name}
              value={formatUsd(Number(a.price)) + " /mo"}
              muted
            />
          ))
        ) : (
          <Row label="Add-ons" value="No add-ons" muted />
        )}
      </dl>

      <dl
        className={cn(
          "flex flex-col gap-2 rounded-lg border p-3",
          breakdown.autopay
            ? "border-mahalo-blue-600/40 bg-surface"
            : "border-border",
        )}
      >
        <div className="flex items-center justify-between text-base">
          <dt className="font-semibold text-mahalo-navy-900">Monthly total</dt>
          <dd className="font-semibold text-mahalo-navy-900">
            {formatUsd(breakdown.monthlyTotal)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              /mo
            </span>
          </dd>
        </div>
        <p className="text-xs text-muted-foreground">
          {breakdown.autopay
            ? "Autopay rate."
            : `Enable autopay and save ${formatUsd(
                breakdown.monthlyStandard - breakdown.monthlyAutopay,
              )} /mo.`}
        </p>
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className={muted ? "text-muted-foreground" : "text-mahalo-navy-900"}>
        {label}
      </dt>
      <dd className={muted ? "text-muted-foreground" : "text-mahalo-navy-900"}>
        {value}
      </dd>
    </div>
  );
}
