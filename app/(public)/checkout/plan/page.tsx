import Link from "next/link";
import { redirect } from "next/navigation";

import { PlanCard } from "@/components/checkout/plan-card";
import { Button } from "@/components/ui/button";
import { getAvailableProviders } from "@/lib/coverage/availability";
import { getCurrentDraft } from "@/lib/orders/draft";

export const dynamic = "force-dynamic";

export default async function CheckoutPlanPage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.zipCode) redirect("/");

  const result = await getAvailableProviders(draft.zipCode);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Step 2 of 8</span>
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Choose your plan
        </h1>
        <p className="text-sm text-muted-foreground">
          {result.ok ? (
            <>
              Plans available for ZIP{" "}
              <span className="font-mono text-mahalo-navy-900">
                {result.zip}
              </span>
              .
            </>
          ) : (
            <>We couldn&apos;t verify your address. Please start over.</>
          )}
        </p>
      </header>

      {!result.ok ? (
        <NoCoverage
          message={result.error.message}
          variant="error"
        />
      ) : result.providers.length === 0 ? (
        <NoCoverage
          message={`No providers cover ZIP ${result.zip} yet.`}
          variant="empty"
        />
      ) : (
        <div className="flex flex-col gap-10">
          {result.providers.map(({ provider, plans }) => (
            <section
              key={provider.id}
              aria-labelledby={`provider-${provider.id}`}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: provider.primaryColor }}
                />
                <h2
                  id={`provider-${provider.id}`}
                  className="text-base font-semibold text-mahalo-navy-900"
                >
                  {provider.name}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} provider={provider} plan={plan} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
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
        {variant === "empty" ? "No coverage yet" : "We hit a snag"}
      </h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" render={<Link href="/" />}>
        Back to home
      </Button>
    </div>
  );
}
