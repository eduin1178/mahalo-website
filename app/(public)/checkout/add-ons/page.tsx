import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { AddOnsForm } from "@/components/checkout/add-ons-form";
import { listAddOnsByProvider } from "@/lib/add-ons/queries";
import { getDb } from "@/lib/db/client";
import { providers } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function CheckoutAddOnsPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");

  const all = await listAddOnsByProvider(draft.providerId);
  const active = all.filter((a) => a.isActive);

  if (active.length === 0) redirect("/checkout/summary");

  const db = getDb();
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, draft.providerId))
    .limit(1);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Step 3 of 8</span>
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Add extras to your plan
        </h1>
        <p className="text-sm text-muted-foreground">
          Optional add-ons from {provider?.name ?? "your provider"}. You can
          skip this step.
        </p>
      </header>

      <AddOnsForm
        addOns={active}
        primaryColor={provider?.primaryColor ?? "#1448a0"}
        initialSelected={draft.addOnIds ?? []}
      />
    </div>
  );
}
