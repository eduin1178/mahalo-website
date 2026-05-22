import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Phase1Form,
  type Phase1ProviderEntry,
} from "@/components/checkout/phase1-form";
import { Button } from "@/components/ui/button";
import { listAddOnsByProvider } from "@/lib/add-ons/queries";
import { getAvailableProviders } from "@/lib/coverage/availability";
import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function CheckoutPlanPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.zipCode) redirect("/");

  const result = await getAvailableProviders(draft.zipCode);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <Header zip={null} />
        <NoCoverage message={result.error.message} variant="error" />
      </div>
    );
  }

  if (result.providers.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header zip={result.zip} />
        <NoCoverage
          message={`Todavía no hay proveedores para el ZIP ${result.zip}.`}
          variant="empty"
        />
      </div>
    );
  }

  const entries: Phase1ProviderEntry[] = await Promise.all(
    result.providers.map(async ({ provider, plans }) => {
      const all = await listAddOnsByProvider(provider.id);
      return {
        provider,
        plans,
        addOns: all.filter((a) => a.isActive),
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <Header zip={result.zip} />
      <Phase1Form
        entries={entries}
        initialPlanId={draft.planId ?? null}
        initialAddOnIds={Array.isArray(draft.addOnIds) ? draft.addOnIds : []}
      />
    </div>
  );
}

function Header({ zip }: { zip: string | null }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
        Elige tu plan
      </h1>
      <p className="text-sm text-muted-foreground">
        {zip ? (
          <>
            Planes disponibles para el ZIP{" "}
            <span className="font-mono text-mahalo-navy-900">{zip}</span>.
          </>
        ) : (
          <>No pudimos verificar tu dirección. Empieza de nuevo.</>
        )}
      </p>
    </header>
  );
}

function NoCoverage({
  message,
  variant,
}: {
  message: string;
  variant: "empty" | "error";
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-surface px-6 py-10">
      <h2 className="text-lg font-semibold text-mahalo-navy-900">
        {variant === "empty" ? "Aún sin cobertura" : "Tuvimos un problema"}
      </h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" render={<Link href="/" />}>
        Volver al inicio
      </Button>
    </div>
  );
}
