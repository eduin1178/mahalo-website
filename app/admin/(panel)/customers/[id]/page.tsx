import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/brand/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/clerk/require-role";
import { getCustomerById } from "@/lib/customers/queries";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDateTime(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function CustomerDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  await requireRole("agent");
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  const detail = await getCustomerById(id);
  if (!detail) notFound();

  const { customer, orders } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
            Customer
          </p>
          <h1 className="text-3xl font-bold text-mahalo-navy-900">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-xs text-muted-foreground">
            Joined {fmtDateTime(customer.createdAt)}
          </p>
        </div>
        <Link
          href="/admin/customers"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Back to customers
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mahalo-navy-900">
          Personal info
        </h2>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <Field label="First name" value={customer.firstName} />
          <Field label="Last name" value={customer.lastName} />
          <Field label="Email" value={customer.email} />
          <Field label="Phone" value={customer.phone} />
          <Field label="Phone type" value={customer.phoneType} />
        </dl>
      </section>

      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mahalo-navy-900">
            Orders
          </h2>
          <span className="text-xs text-muted-foreground">
            {orders.length} total
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  This customer has no orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-mahalo-navy-900">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.provider?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.plan?.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.scheduledAt
                      ? row.scheduledAt.toISOString().slice(0, 16).replace("T", " ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.createdAt.toISOString().slice(0, 10)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
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
