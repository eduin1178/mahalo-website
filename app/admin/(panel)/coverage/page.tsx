import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddZipsForm } from "@/components/admin/coverage/add-zips-form";
import { CoverageSearchForm } from "@/components/admin/coverage/coverage-search-form";
import { ProviderSelector } from "@/components/admin/coverage/provider-selector";
import { RemoveZipButton } from "@/components/admin/coverage/remove-zip-button";
import { requireRole } from "@/lib/clerk/require-role";
import { listCoverageByProvider } from "@/lib/coverage/queries";
import { listProviders } from "@/lib/providers/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  provider?: string;
  search?: string;
  page?: string;
}>;

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("admin");

  const sp = await searchParams;
  const providers = await listProviders();
  const selectedProvider =
    sp.provider && providers.find((p) => p.id === sp.provider)
      ? providers.find((p) => p.id === sp.provider)!
      : null;

  const search = (sp.search ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const coverage = selectedProvider
    ? await listCoverageByProvider(selectedProvider.id, { search, page })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
            Catalog
          </p>
          <h1 className="text-3xl font-bold text-mahalo-navy-900">Coverage</h1>
          <p className="text-sm text-muted-foreground">
            Assign ZIP codes to each provider. Customers see only providers
            covering their ZIP.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title="CSV bulk import coming in a future sprint"
        >
          Import CSV (soon)
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-mahalo-navy-900">
            Provider
          </span>
          <ProviderSelector
            providers={providers.map((p) => ({
              id: p.id,
              name: p.name,
              isActive: p.isActive,
            }))}
            selectedId={selectedProvider?.id ?? null}
          />
        </div>
      </div>

      {!selectedProvider ? (
        <p className="rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
          Select a provider to view and edit its ZIP coverage.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-mahalo-navy-900">
                  {selectedProvider.name} · {coverage!.total} ZIP
                  {coverage!.total === 1 ? "" : "s"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Sorted ascending. Filter by 5-digit prefix.
                </p>
              </div>
              <CoverageSearchForm
                providerId={selectedProvider.id}
                defaultValue={search}
              />
            </div>

            <div className="rounded-xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ZIP code</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-[1%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coverage!.rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        {search
                          ? "No ZIPs match that prefix."
                          : "No ZIPs assigned yet. Add some on the right."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    coverage!.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-mahalo-navy-900">
                          {row.zipCode}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.createdAt.toISOString().slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          <RemoveZipButton
                            providerId={selectedProvider.id}
                            zip={row.zipCode}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              providerId={selectedProvider.id}
              search={search}
              page={coverage!.page}
              totalPages={coverage!.totalPages}
              total={coverage!.total}
              pageSize={coverage!.pageSize}
            />
          </section>

          <aside className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-mahalo-navy-900">
              Add ZIPs
            </h2>
            <AddZipsForm providerId={selectedProvider.id} />
          </aside>
        </div>
      )}
    </div>
  );
}

function Pagination({
  providerId,
  search,
  page,
  totalPages,
  total,
  pageSize,
}: {
  providerId: string;
  search: string;
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
    params.set("provider", providerId);
    if (search) params.set("search", search);
    if (p > 1) params.set("page", String(p));
    return `/admin/coverage?${params}`;
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
