import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { CustomizeForm } from "@/components/checkout/customize-form";
import { getDb } from "@/lib/db/client";
import { providers } from "@/lib/db/schema";
import { listAddOnsByProvider } from "@/lib/add-ons/queries";
import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function CheckoutCustomizePage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");

  const addOns = (await listAddOnsByProvider(draft.providerId)).filter(
    (a) => a.isActive,
  );
  // Defensive guard: a no-add-ons provider should never land here (the plan
  // step decides the skip), but deep links must not show an empty page.
  if (addOns.length === 0) redirect("/checkout/details");

  const db = getDb();
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, draft.providerId))
    .limit(1);
  if (!provider) redirect("/checkout/plan");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Customize your plan
        </h1>
        <p className="text-sm text-muted-foreground">
          Add optional extras to your {provider.name} service. You can skip any
          you don’t need.
        </p>
      </header>

      <CustomizeForm
        provider={provider}
        addOns={addOns}
        initialAddOnIds={Array.isArray(draft.addOnIds) ? draft.addOnIds : []}
      />
    </div>
  );
}
