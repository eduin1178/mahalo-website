import { redirect } from "next/navigation";

import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function LegacyPaymentRedirect() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  redirect("/checkout/details");
}
