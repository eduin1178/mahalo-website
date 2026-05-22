import { redirect } from "next/navigation";

import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function LegacySummaryRedirect() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  if (!draft.customerId) redirect("/checkout/details");
  redirect("/checkout/schedule");
}
