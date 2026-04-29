import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { providers } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal, formatUsd } from "@/lib/orders/totals";

export const dynamic = "force-dynamic";

export default async function CheckoutSummaryPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");

  const breakdown = await calculateTotal(draft, false);
  if (!breakdown) redirect("/checkout/plan");

  const db = getDb();
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, draft.providerId))
    .limit(1);

  const address = draft.installationAddress;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Step 4 of 8</span>
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Review your order
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm the details below before you continue.
        </p>
      </header>

      <section
        aria-labelledby="summary-plan"
        className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5"
      >
        <div className="flex items-center gap-3">
          {provider ? (
            <span
              aria-hidden
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: provider.primaryColor }}
            />
          ) : null}
          <h2
            id="summary-plan"
            className="text-base font-semibold text-mahalo-navy-900"
          >
            {provider?.name ?? "Provider"} · {breakdown.plan.name}
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Speed
            </dt>
            <dd className="text-mahalo-navy-900">{breakdown.plan.speed}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Monthly price
            </dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(breakdown.planPriceStandard)}
              <span className="text-xs text-muted-foreground"> /mo</span>
            </dd>
          </div>
        </dl>
        {breakdown.plan.features.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {breakdown.plan.features.map((f) => (
              <li
                key={f}
                className="rounded-full border border-border bg-surface px-2 py-1"
              >
                {f}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section
        aria-labelledby="summary-addons"
        className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5"
      >
        <div className="flex items-center justify-between">
          <h2
            id="summary-addons"
            className="text-base font-semibold text-mahalo-navy-900"
          >
            Add-ons
          </h2>
          <Link
            href="/checkout/add-ons"
            className="text-xs font-medium text-mahalo-blue-600 hover:underline"
          >
            Edit
          </Link>
        </div>
        {breakdown.addOns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No add-ons selected.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {breakdown.addOns.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-mahalo-navy-900">{a.name}</span>
                <span className="text-mahalo-navy-900">
                  {formatUsd(Number(a.price))}
                  <span className="text-xs text-muted-foreground"> /mo</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="summary-address"
        className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5"
      >
        <h2
          id="summary-address"
          className="text-base font-semibold text-mahalo-navy-900"
        >
          Installation address
        </h2>
        {address ? (
          <address className="not-italic text-sm text-mahalo-navy-900">
            {address.line1}
            {address.line2 ? (
              <>
                <br />
                {address.line2}
              </>
            ) : null}
            <br />
            {address.city ? `${address.city}, ` : null}
            {address.state} {address.zip}
          </address>
        ) : (
          <p className="text-sm text-muted-foreground">
            ZIP {draft.zipCode}. You&apos;ll confirm the full address in the
            next step.
          </p>
        )}
      </section>

      <section
        aria-labelledby="summary-total"
        className="flex flex-col gap-3 rounded-xl border border-mahalo-navy-900/10 bg-surface p-5"
      >
        <h2
          id="summary-total"
          className="text-base font-semibold text-mahalo-navy-900"
        >
          Estimated monthly total
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(breakdown.planPriceStandard)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Add-ons</dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(breakdown.addOnsMonthly)}
            </dd>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <dt className="font-semibold text-mahalo-navy-900">Total</dt>
            <dd className="text-lg font-semibold text-mahalo-navy-900">
              {formatUsd(breakdown.monthlyStandard)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                /mo
              </span>
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Save {formatUsd(breakdown.monthlyStandard - breakdown.monthlyAutopay)}{" "}
          /mo with autopay (configurable in the next steps).
        </p>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" render={<Link href="/checkout/add-ons" />}>
          Back
        </Button>
        <Button variant="primary" render={<Link href="/checkout/customer" />}>
          Continue
        </Button>
      </div>
    </div>
  );
}
