import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { RescheduleForm } from "@/components/admin/orders/reschedule-form";
import { StatusChanger } from "@/components/admin/orders/status-changer";
import { StatusBadge } from "@/components/brand/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/clerk/require-role";
import type { AddressJson } from "@/lib/db/schema";
import { getOrderById } from "@/lib/orders/queries";
import { formatSpeed } from "@/lib/plans/speed";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtAddress(a: AddressJson | null): string {
  if (!a) return "—";
  const line2 = a.line2 ? ` ${a.line2}` : "";
  return `${a.line1}${line2}, ${a.city}, ${a.state} ${a.zip}`;
}

function fmtCurrency(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function fmtDateTime(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function OrderDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  await requireRole("agent");
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  const detail = await getOrderById(id);
  if (!detail) notFound();

  const { order, customer, provider, plan, addOns, history } = detail;

  const addOnsTotal = addOns.reduce((sum, a) => sum + Number(a.price), 0);
  const planPrice = plan
    ? Number(order.autopayEnabled ? plan.priceAutopay : plan.priceStandard)
    : 0;
  const total = planPrice + addOnsTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
            Order detail
          </p>
          <h1 className="text-3xl font-bold text-mahalo-navy-900">
            <span className="font-mono">{order.id.slice(0, 8)}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Created {fmtDateTime(order.createdAt)} · Updated{" "}
            {fmtDateTime(order.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Link
            href="/admin/orders"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Back to orders
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Customer">
            {customer ? (
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                <Field
                  label="Name"
                  value={`${customer.firstName} ${customer.lastName}`}
                />
                <Field label="Email" value={customer.email} />
                <Field label="Phone" value={customer.phone} />
                <Field label="Phone type" value={customer.phoneType} />
                <Field
                  label="Profile"
                  value={
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-mahalo-blue-600 underline-offset-2 hover:underline"
                    >
                      Open customer
                    </Link>
                  }
                />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No customer linked yet (draft).
              </p>
            )}
          </Section>

          <Section title="Plan & add-ons">
            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <Field label="Provider" value={provider?.name ?? "—"} />
              <Field label="Plan" value={plan?.name ?? "—"} />
              <Field
                label="Speed"
                value={
                  plan ? formatSpeed(plan.speedValue, plan.speedUnit) : "—"
                }
              />
              <Field
                label="Plan price"
                value={`${fmtCurrency(planPrice)} ${
                  order.autopayEnabled ? "(autopay)" : "(standard)"
                }`}
              />
            </dl>
            {addOns.length > 0 ? (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add-ons
                </p>
                <ul className="text-sm">
                  {addOns.map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between border-b border-border/60 py-1 last:border-b-0"
                    >
                      <span>{a.name}</span>
                      <span className="font-mono">{fmtCurrency(a.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm font-semibold text-mahalo-navy-900">
              <span>Total</span>
              <span className="font-mono">{fmtCurrency(total)}</span>
            </div>
          </Section>

          <Section title="Addresses">
            <dl className="grid gap-2 text-sm">
              <Field
                label="Installation"
                value={fmtAddress(order.installationAddress)}
              />
              <Field label="ZIP" value={order.zipCode ?? "—"} />
            </dl>
          </Section>

          <Section title="Payment">
            <dl className="grid gap-2 text-sm">
              <Field
                label="Autopay"
                value={order.autopayEnabled ? "Enrolled" : "Standard billing"}
              />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              {order.autopayEnabled
                ? "Customer chose autopay. Collect the payment method by phone — it is never captured on the site."
                : "Standard billing. No payment method is collected on the site."}
            </p>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Schedule">
            <dl className="mb-4 grid gap-2 text-sm">
              <Field
                label="Preferred call"
                value={fmtDateTime(order.preferredCallAt)}
              />
              <Field
                label="Installation"
                value={fmtDateTime(order.scheduledAt)}
              />
            </dl>
            <p className="mb-4 text-xs text-muted-foreground">
              The customer chose the preferred call time at checkout. Set the
              installation date below after confirming the order by phone.
            </p>
            <RescheduleForm
              orderId={order.id}
              currentScheduledAt={order.scheduledAt}
            />
          </Section>

          <Section title="Change status">
            <StatusChanger orderId={order.id} currentStatus={order.status} />
          </Section>

          <Section title="Status timeline">
            <OrderTimeline history={history} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mahalo-navy-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-mahalo-navy-900">{value}</dd>
    </div>
  );
}
