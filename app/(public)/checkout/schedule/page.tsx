import { redirect } from "next/navigation";

import { ScheduleForm } from "@/components/checkout/schedule-form";
import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function CheckoutSchedulePage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  if (!draft.customerId) redirect("/checkout/customer");

  const existing = draft.scheduledAt ? new Date(draft.scheduledAt) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Step 7 of 8</span>
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Installation schedule
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose when our agent should come install your service. We&apos;ll
          confirm the appointment after you submit the order.
        </p>
      </header>

      <ScheduleForm
        initialYear={existing?.getUTCFullYear()}
        initialMonth={
          existing ? existing.getUTCMonth() + 1 : undefined
        }
        initialDay={existing?.getUTCDate()}
        initialHour={existing?.getUTCHours()}
      />
    </div>
  );
}
