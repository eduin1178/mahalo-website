import Link from "next/link";

import { CustomersSearchForm } from "@/components/admin/customers/customers-search-form";
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
import { listCustomers } from "@/lib/customers/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  page?: string;
}>;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("agent");

  const sp = await searchParams;
  const search = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await listCustomers({ search, page });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
          Operations
        </p>
        <h1 className="text-3xl font-bold text-mahalo-navy-900">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {result.total} customer{result.total === 1 ? "" : "s"} match the
          current filters.
        </p>
      </div>

      <CustomersSearchForm defaultValue={search} />

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead>Last order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No customers match these filters.
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${row.id}`}
                      className="text-mahalo-navy-900 underline-offset-2 hover:underline"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.phone}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.orderCount}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.lastOrderAt
                      ? row.lastOrderAt.toISOString().slice(0, 10)
                      : "—"}
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
    if (sp.q) params.set("q", sp.q);
    if (p > 1) params.set("page", String(p));
    return `/admin/customers${params.size ? `?${params}` : ""}`;
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
