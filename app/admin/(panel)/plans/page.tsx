import Link from "next/link";

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
import { listProviders } from "@/lib/providers/queries";
import { listPlansByProvider } from "@/lib/plans/queries";

export const dynamic = "force-dynamic";

export default async function PlansHubPage() {
  await requireRole("admin");
  const providers = await listProviders();
  const counts = await Promise.all(
    providers.map(async (p) => ({
      provider: p,
      total: (await listPlansByProvider(p.id)).length,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
          Catalog
        </p>
        <h1 className="text-3xl font-bold text-mahalo-navy-900">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Plans are managed per provider. Pick a provider to add, edit or
          reorder its plans.
        </p>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Plans</TableHead>
              <TableHead className="w-[1%]">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No providers yet. Create one in Providers first.
                </TableCell>
              </TableRow>
            ) : (
              counts.map(({ provider, total }) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium text-mahalo-navy-900">
                    {provider.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{total}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link
                      href={`/admin/providers/${provider.id}?tab=plans`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Open
                    </Link>
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
