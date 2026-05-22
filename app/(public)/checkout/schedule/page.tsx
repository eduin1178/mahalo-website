import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { ScheduleForm } from "@/components/checkout/schedule-form";
import { getDb } from "@/lib/db/client";
import { customers, providers, type Customer } from "@/lib/db/schema";
import { getCurrentDraft } from "@/lib/orders/draft";
import { calculateTotal, formatUsd } from "@/lib/orders/totals";

export const dynamic = "force-dynamic";

export default async function CheckoutSchedulePage() {
  const draft = await getCurrentDraft();
  if (!draft) redirect("/");
  if (!draft.providerId || !draft.planId) redirect("/checkout/plan");
  if (!draft.customerId) redirect("/checkout/details");

  const breakdown = await calculateTotal(
    draft,
    draft.autopayEnabled ?? false,
  );
  if (!breakdown) redirect("/checkout/plan");

  const db = getDb();
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, draft.providerId))
    .limit(1);
  let customer: Customer | null = null;
  const [customerRow] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, draft.customerId))
    .limit(1);
  customer = customerRow ?? null;

  const existing = draft.scheduledAt ? new Date(draft.scheduledAt) : null;
  const installation = draft.installationAddress;
  const billing = draft.billingAddress;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-mahalo-navy-900 sm:text-3xl">
          Instalación y confirmación
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige cuándo debe ir nuestro agente a instalar tu servicio. Revisa los
          detalles antes de confirmar.
        </p>
      </header>

      <ScheduleForm
        initialYear={existing?.getUTCFullYear()}
        initialMonth={existing ? existing.getUTCMonth() + 1 : undefined}
        initialDay={existing?.getUTCDate()}
        initialHour={existing?.getUTCHours()}
      />

      <section
        aria-labelledby="review-heading"
        className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5"
      >
        <h2
          id="review-heading"
          className="text-base font-semibold text-mahalo-navy-900"
        >
          Revisa tu pedido
        </h2>

        <ReviewRow
          label="Plan"
          editHref="/checkout/plan"
          value={
            <>
              <span className="font-medium text-mahalo-navy-900">
                {provider?.name ?? "Proveedor"} · {breakdown.plan.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {breakdown.plan.speed} · {formatUsd(breakdown.planPriceStandard)}{" "}
                /mes
              </span>
            </>
          }
        />

        <ReviewRow
          label="Extras"
          editHref="/checkout/plan"
          value={
            breakdown.addOns.length === 0 ? (
              <span className="text-muted-foreground">Sin extras</span>
            ) : (
              <ul className="flex flex-col gap-0.5 text-sm text-mahalo-navy-900">
                {breakdown.addOns.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{a.name}</span>
                    <span>{formatUsd(Number(a.price))} /mes</span>
                  </li>
                ))}
              </ul>
            )
          }
        />

        <ReviewRow
          label="Contacto"
          editHref="/checkout/details"
          value={
            customer ? (
              <>
                <span className="block text-mahalo-navy-900">
                  {customer.firstName} {customer.lastName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {customer.email} · {customer.phone}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Sin datos</span>
            )
          }
        />

        <ReviewRow
          label="Dirección de instalación"
          editHref="/checkout/details"
          value={
            installation ? (
              <address className="not-italic text-sm text-mahalo-navy-900">
                {installation.line1}
                {installation.line2 ? (
                  <>
                    <br />
                    {installation.line2}
                  </>
                ) : null}
                <br />
                {installation.city ? `${installation.city}, ` : null}
                {installation.state} {installation.zip}
              </address>
            ) : (
              <span className="text-muted-foreground">Sin dirección</span>
            )
          }
        />

        {billing ? (
          <ReviewRow
            label="Dirección de facturación"
            editHref="/checkout/details"
            value={
              <address className="not-italic text-sm text-mahalo-navy-900">
                {billing.line1}
                {billing.line2 ? (
                  <>
                    <br />
                    {billing.line2}
                  </>
                ) : null}
                <br />
                {billing.city ? `${billing.city}, ` : null}
                {billing.state} {billing.zip}
              </address>
            }
          />
        ) : null}

        <ReviewRow
          label="Pago"
          editHref="/checkout/details"
          value={
            draft.autopayEnabled ? (
              <span className="text-mahalo-navy-900">
                Pago automático activo
                {draft.paymentData?.type === "card"
                  ? " · Tarjeta"
                  : draft.paymentData?.type === "ach"
                    ? " · Banco (ACH)"
                    : ""}
              </span>
            ) : (
              <span className="text-mahalo-navy-900">Facturación estándar</span>
            )
          }
        />

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-mahalo-navy-900">
            Total mensual
          </span>
          <span className="text-lg font-semibold text-mahalo-navy-900">
            {formatUsd(breakdown.monthlyTotal)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              /mes
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  editHref,
}: {
  label: string;
  value: React.ReactNode;
  editHref: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Link
          href={editHref}
          className="text-xs font-medium text-mahalo-blue-600 hover:underline"
        >
          Editar
        </Link>
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
