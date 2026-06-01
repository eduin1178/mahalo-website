import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { ScheduleForm } from "@/components/checkout/schedule-form";
import { SectionCard } from "@/components/checkout/section-card";
import { getDb } from "@/lib/db/client";
import { customers, providers, type Customer } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal, formatUsd } from "@/lib/orders/totals";

export const dynamic = "force-dynamic";

export default async function CheckoutSchedulePage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  if (!draft.customerId) redirect("/checkout/details");

  const breakdown = await calculateTotal(
    draft,
    draft.autopayEnabled ?? false,
  );
  if (!breakdown) redirect("/checkout/plan");

  const db = getDb();
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, draft.providerId))
    .limit(1);
  let customer: Customer | null = null;
  const [customerRow] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, draft.customerId))
    .limit(1);
  customer = customerRow ?? null;

  const existing = draft.scheduledAt ? new Date(draft.scheduledAt) : null;
  const installation = draft.installationAddress;
  const billing = draft.billingAddress;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Installation and confirmation
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose when our technician should install your service. Review the
          details before confirming.
        </p>
      </header>

      <ScheduleForm
        initialYear={existing?.getUTCFullYear()}
        initialMonth={existing ? existing.getUTCMonth() + 1 : undefined}
        initialDay={existing?.getUTCDate()}
        initialHour={existing?.getUTCHours()}
      />

      <SectionCard labelledBy="review-heading">
        <h2
          id="review-heading"
          className="text-base font-semibold text-mahalo-navy-900"
        >
          Review your order
        </h2>

        <ReviewRow
          label="Plan"
          editHref="/checkout/plan"
          value={
            <>
              <span className="font-medium text-mahalo-navy-900">
                {provider?.name ?? "Proveedor"} · {breakdown.plan.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {breakdown.plan.speed} · {formatUsd(breakdown.planPriceStandard)}{" "}
                /mo
              </span>
            </>
          }
        />

        <ReviewRow
          label="Add-ons"
          editHref="/checkout/plan"
          value={
            breakdown.addOns.length === 0 ? (
              <span className="text-muted-foreground">No add-ons</span>
            ) : (
              <ul className="flex flex-col gap-0.5 text-sm text-mahalo-navy-900">
                {breakdown.addOns.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{a.name}</span>
                    <span>{formatUsd(Number(a.price))} /mo</span>
                  </li>
                ))}
              </ul>
            )
          }
        />

        <ReviewRow
          label="Contact"
          editHref="/checkout/details"
          value={
            customer ? (
              <>
                <span className="block text-mahalo-navy-900">
                  {customer.firstName} {customer.lastName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {customer.email} · {customer.phone}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No info</span>
            )
          }
        />

        <ReviewRow
          label="Installation address"
          editHref="/checkout/details"
          value={
            installation ? (
              <address className="not-italic text-sm text-mahalo-navy-900">
                {installation.line1}
                {installation.line2 ? (
                  <>
                    <br />
                    {installation.line2}
                  </>
                ) : null}
                <br />
                {installation.city ? `${installation.city}, ` : null}
                {installation.state} {installation.zip}
              </address>
            ) : (
              <span className="text-muted-foreground">No address</span>
            )
          }
        />

        {billing ? (
          <ReviewRow
            label="Billing address"
            editHref="/checkout/details"
            value={
              <address className="not-italic text-sm text-mahalo-navy-900">
                {billing.line1}
                {billing.line2 ? (
                  <>
                    <br />
                    {billing.line2}
                  </>
                ) : null}
                <br />
                {billing.city ? `${billing.city}, ` : null}
                {billing.state} {billing.zip}
              </address>
            }
          />
        ) : null}

        <ReviewRow
          label="Payment"
          editHref="/checkout/details"
          value={
            draft.autopayEnabled ? (
              <span className="text-mahalo-navy-900">
                Autopay active
                {draft.paymentData?.type === "card"
                  ? " · Card"
                  : draft.paymentData?.type === "ach"
                    ? " · Bank (ACH)"
                    : ""}
              </span>
            ) : (
              <span className="text-mahalo-navy-900">Standard billing</span>
            )
          }
        />

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-mahalo-navy-900">
            Monthly total
          </span>
          <span className="text-lg font-semibold text-mahalo-navy-900">
            {formatUsd(breakdown.monthlyTotal)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              /mo
            </span>
          </span>
        </div>
      </SectionCard>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  editHref,
}: {
  label: string;
  value: React.ReactNode;
  editHref: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Link
          href={editHref}
          className="text-xs font-medium text-mahalo-blue-600 hover:underline"
        >
          Edit
        </Link>
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
