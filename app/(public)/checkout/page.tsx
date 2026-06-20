import { redirect } from "next/navigation";

import { DraftBootstrap } from "@/components/checkout/draft-bootstrap";
import { getCurrentDraft } from "@/lib/orders/draft";

type SearchParams = Promise<{
  zip?: string | string[];
}>;

function pickFirst(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function CheckoutEntryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const zip = pickFirst(sp.zip);

  if (!zip) {
    const existing = await getCurrentDraft();
    if (existing) redirect("/checkout/plan");
    redirect("/");
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
        Checking availability…
      </h1>
      <p className="text-sm text-muted-foreground">
        We’re looking for providers in your area.
      </p>
      <DraftBootstrap zip={zip} />
    </div>
  );
}
