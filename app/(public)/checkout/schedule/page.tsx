import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { ReviewOrderCard } from "@/components/checkout/review-order-card";
import { ScheduleForm } from "@/components/checkout/schedule-form";
import { getDb } from "@/lib/db/client";
import { customers, providers, type Customer } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal } from "@/lib/orders/totals";

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
        reviewSlot={
          <ReviewOrderCard
            breakdown={breakdown}
            provider={provider ?? null}
            customer={customer}
            installation={installation}
            billing={billing}
            autopayEnabled={draft.autopayEnabled ?? false}
            paymentType={draft.paymentData?.type ?? null}
          />
        }
      />
    </div>
  );
}
