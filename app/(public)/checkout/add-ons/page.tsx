import { redirect } from "next/navigation";

import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function LegacyAddOnsRedirect() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  redirect("/checkout/plan");
}
