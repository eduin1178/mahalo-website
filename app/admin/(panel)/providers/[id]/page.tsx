import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ProviderActiveToggle } from "@/components/admin/providers/provider-active-toggle";
import { ProviderEditForm } from "@/components/admin/providers/provider-edit-form";
import { ProviderLogoForm } from "@/components/admin/providers/provider-logo-form";
import { requireRole } from "@/lib/clerk/require-role";
import { getProviderById } from "@/lib/providers/queries";

export const dynamic = "force-dynamic";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const provider = await getProviderById(id);
  if (!provider) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/admin/providers"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600 hover:underline"
        >
          ← Providers
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-mahalo-navy-900">
            {provider.name}
          </h1>
          <div className="flex items-center gap-3">
            {provider.isActive ? (
              <Badge variant="secondary">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
            <ProviderActiveToggle id={provider.id} isActive={provider.isActive} />
          </div>
        </div>
      </div>

      <section className="space-y-3 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-mahalo-navy-900">Logo</h2>
        <ProviderLogoForm
          id={provider.id}
          currentUrl={provider.logoUrl}
          providerName={provider.name}
        />
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-mahalo-navy-900">Details</h2>
        <ProviderEditForm
          id={provider.id}
          initialName={provider.name}
          initialColor={provider.primaryColor}
        />
      </section>
    </div>
  );
}
