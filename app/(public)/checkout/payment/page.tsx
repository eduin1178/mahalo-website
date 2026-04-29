import { redirect } from "next/navigation";

import { PaymentForm } from "@/components/checkout/payment-form";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal } from "@/lib/orders/totals";

export const dynamic = "force-dynamic";

export default async function CheckoutPaymentPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  if (!draft.customerId) redirect("/checkout/customer");

  const breakdown = await calculateTotal(draft, false);
  if (!breakdown) redirect("/checkout/plan");

  const initialMethod: "card" | "ach" =
    draft.paymentData?.type === "ach" ? "ach" : "card";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Step 6 of 8</span>
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Payment preference
        </h1>
        <p className="text-sm text-muted-foreground">
          Enroll in autopay to lock in the discounted rate, or skip for now and
          we&apos;ll bill you the standard amount.
        </p>
      </header>

      <PaymentForm
        monthlyStandard={breakdown.monthlyStandard}
        monthlyAutopay={breakdown.monthlyAutopay}
        initialAutopay={draft.autopayEnabled}
        initialMethod={initialMethod}
      />
    </div>
  );
}
