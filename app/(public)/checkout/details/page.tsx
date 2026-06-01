import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import {
  Phase2Form,
  type Phase2FormInitialValues,
} from "@/components/checkout/phase2-form";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal } from "@/lib/orders/totals";

export const dynamic = "force-dynamic";

export default async function CheckoutDetailsPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");

  const breakdown = await calculateTotal(draft, false);
  if (!breakdown) redirect("/checkout/plan");

  const installation = draft.installationAddress;
  const billing = draft.billingAddress;

  let existing: typeof customers.$inferSelect | null = null;
  if (draft.customerId) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, draft.customerId))
      .limit(1);
    existing = row ?? null;
  }

  const initial: Phase2FormInitialValues = {
    firstName: existing?.firstName ?? "",
    lastName: existing?.lastName ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
    phoneType: existing?.phoneType ?? "mobile",
    installationAddress: {
      line1: installation?.line1 ?? "",
      line2: installation?.line2 ?? "",
      city: installation?.city ?? "",
      state: installation?.state ?? "",
      zip: installation?.zip ?? draft.zipCode ?? "",
    },
    useDifferentBilling: Boolean(billing),
    billingAddress: {
      line1: billing?.line1 ?? "",
      line2: billing?.line2 ?? "",
      city: billing?.city ?? "",
      state: billing?.state ?? "",
      zip: billing?.zip ?? "",
    },
    autopay: draft.autopayEnabled ?? false,
    paymentMethod: draft.paymentData?.type === "ach" ? "ach" : "card",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Your details
        </h1>
        <p className="text-sm text-muted-foreground">
          We need your contact information, addresses, and payment preference.
        </p>
      </header>

      <Phase2Form
        initial={initial}
        monthlyStandard={breakdown.monthlyStandard}
        monthlyAutopay={breakdown.monthlyAutopay}
      />
    </div>
  );
}
