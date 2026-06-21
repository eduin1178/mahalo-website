import { redirect } from "next/navigation";

import { ScheduleForm } from "@/components/checkout/schedule-form";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal } from "@/lib/orders/totals";

export const dynamic = "force-dynamic";

export default async function CheckoutSchedulePage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  if (!draft.customerId) redirect("/checkout/details");

  // Guard: a draft that can't price a plan is incomplete; send it back.
  const breakdown = await calculateTotal(draft, draft.autopayEnabled ?? false);
  if (!breakdown) redirect("/checkout/plan");

  const existing = draft.scheduledAt ? new Date(draft.scheduledAt) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Installation and confirmation
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose when our technician should install your service.
        </p>
      </header>

      <ScheduleForm
        initialYear={existing?.getUTCFullYear()}
        initialMonth={existing ? existing.getUTCMonth() + 1 : undefined}
        initialDay={existing?.getUTCDate()}
        initialHour={existing?.getUTCHours()}
      />
    </div>
  );
}
