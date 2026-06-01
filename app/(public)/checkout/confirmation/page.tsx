import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/checkout/confetti-burst";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { readDraftOrderId } from "@/lib/orders/draft";
import { submitOrder } from "@/lib/orders/draft-actions";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmationPage() {
  const orderId = await readDraftOrderId();
  if (!orderId) redirect("/");

  const db = getDb();
  const [current] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!current) redirect("/");

  if (current.status === "Draft") {
    const result = await submitOrder();
    if (!result.ok) {
      return (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
            We couldn’t submit your order
          </h1>
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <div>
            <Button render={<Link href="/checkout/schedule" />}>
              Back to scheduling
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfettiBurst />
      <div className="relative overflow-hidden rounded-3xl premium-light-card p-8 text-center md:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mahalo-cyan-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center gap-5">
          <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success ring-8 ring-success/5">
            <Check className="size-8" strokeWidth={2.5} aria-hidden="true" />
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-mahalo-navy-900 sm:text-4xl">
              You’re all set!
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              Thank you! One of our agents will contact you soon to verify your
              identity (SSN and date of birth) before activating the service.
              You’ll receive an email confirmation as soon as the order is
              created with your provider.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/70 px-6 py-3 ring-1 ring-mahalo-navy-900/10">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Order reference
            </span>
            <span className="font-mono text-lg font-semibold text-mahalo-navy-900">
              {orderId.slice(0, 8)}
            </span>
          </div>

          <Button
            render={<Link href="/" />}
            variant="primary"
            size="lg"
            className="h-12 rounded-xl px-10 text-base font-semibold"
          >
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
