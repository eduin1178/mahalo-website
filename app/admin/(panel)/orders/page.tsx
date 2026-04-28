import Link from "next/link";

import { OrdersFilters } from "@/components/admin/orders/orders-filters";
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
import { orderStatusValues, type OrderStatus } from "@/lib/db/schema";
import { listOrders } from "@/lib/orders/queries";
import { listProviders } from "@/lib/providers/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string | string[];
  provider?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
}>;

const VALID_STATUS = new Set<string>(orderStatusValues);

function parseStatuses(raw: string | string[] | undefined): OrderStatus[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((s): s is OrderStatus => VALID_STATUS.has(s));
}

function parseDate(raw: string | undefined, endOfDay = false): Date | undefined {
  if (!raw) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("agent");

  const sp = await searchParams;
  const statuses = parseStatuses(sp.status);
  const providerId = sp.provider ?? "";
  const dateFromRaw = sp.from ?? "";
  const dateToRaw = sp.to ?? "";
  const search = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const [providers, result] = await Promise.all([
    listProviders(),
    listOrders({
      statuses,
      providerId: providerId || undefined,
      dateFrom: parseDate(dateFromRaw),
      dateTo: parseDate(dateToRaw, true),
      search,
      page,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
          Operations
        </p>
        <h1 className="text-3xl font-bold text-mahalo-navy-900">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {result.total} order{result.total === 1 ? "" : "s"} match the current
          filters.
        </p>
      </div>

      <OrdersFilters
        providers={providers.map((p) => ({ id: p.id, name: p.name }))}
        initial={{
          statuses,
          providerId,
          dateFrom: dateFromRaw,
          dateTo: dateToRaw,
          search,
        }}
      />

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No orders match these filters.
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-mahalo-navy-900">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {row.customer ? (
                      <div>
                        <div className="text-sm text-mahalo-navy-900">
                          {row.customer.firstName} {row.customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.customer.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
      </div>

      <Pagination
        sp={sp}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
      />
    </div>
  );
}

function Pagination({
  sp,
  page,
  totalPages,
  total,
  pageSize,
}: {
  sp: Awaited<SearchParams>;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function href(p: number) {
    const params = new URLSearchParams();
    const statuses = Array.isArray(sp.status)
      ? sp.status
      : sp.status
        ? [sp.status]
        : [];
    statuses.forEach((s) => params.append("status", s));
    if (sp.provider) params.set("provider", sp.provider);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    if (sp.q) params.set("q", sp.q);
    if (p > 1) params.set("page", String(p));
    return `/admin/orders${params.size ? `?${params}` : ""}`;
  }

  const linkCls = buttonVariants({ variant: "ghost", size: "sm" });
  const disabledCls = "pointer-events-none opacity-40";

  return (
    <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Link
          href={href(Math.max(1, page - 1))}
          className={`${linkCls} ${page <= 1 ? disabledCls : ""}`}
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <span className="px-2">
          Page {page} / {totalPages}
        </span>
        <Link
          href={href(Math.min(totalPages, page + 1))}
          className={`${linkCls} ${page >= totalPages ? disabledCls : ""}`}
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
