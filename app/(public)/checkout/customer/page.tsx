import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { CustomerForm, type CustomerFormInitialValues } from "@/components/checkout/customer-form";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function CheckoutCustomerPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");

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

  const initial: CustomerFormInitialValues = {
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
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Step 5 of 8</span>
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Your information
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll use these details to coordinate your installation.
        </p>
      </header>

      <CustomerForm initial={initial} />
    </div>
  );
}
