import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewProviderDialog } from "@/components/admin/providers/new-provider-dialog";
import { ProviderActiveToggle } from "@/components/admin/providers/provider-active-toggle";
import { requireRole } from "@/lib/clerk/require-role";
import { listProviders } from "@/lib/providers/queries";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  await requireRole("admin");
  const rows = await listProviders();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
            Catalog
          </p>
          <h1 className="text-3xl font-bold text-mahalo-navy-900">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Manage carriers, branding and availability.
          </p>
        </div>
        <NewProviderDialog />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No providers yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-mahalo-navy-900">
                    <Link
                      href={`/admin/providers/${p.id}`}
                      className="hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoUrl}
                        alt={`${p.name} logo`}
                        className="h-8 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-5 w-5 rounded border"
                        style={{ backgroundColor: p.primaryColor }}
                        aria-hidden
                      />
                      <code className="text-xs">{p.primaryColor}</code>
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    <Link
                      href={`/admin/providers/${p.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Edit
                    </Link>
                    <ProviderActiveToggle id={p.id} isActive={p.isActive} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
