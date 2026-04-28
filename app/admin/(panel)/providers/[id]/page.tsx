import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderActiveToggle } from "@/components/admin/providers/provider-active-toggle";
import { ProviderEditForm } from "@/components/admin/providers/provider-edit-form";
import { ProviderLogoForm } from "@/components/admin/providers/provider-logo-form";
import { PlansSection } from "@/components/admin/plans/plans-section";
import { AddOnsSection } from "@/components/admin/add-ons/add-ons-section";
import { requireRole } from "@/lib/clerk/require-role";
import { getProviderById } from "@/lib/providers/queries";
import { listPlansByProvider } from "@/lib/plans/queries";
import { listAddOnsByProvider } from "@/lib/add-ons/queries";

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

  const plans = await listPlansByProvider(provider.id);
  const addOns = await listAddOnsByProvider(provider.id);

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

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="plans">Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="add-ons">Add-ons ({addOns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-8 pt-4">
          <section className="space-y-3 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-mahalo-navy-900">Logo</h2>
            <ProviderLogoForm
              id={provider.id}
              currentUrl={provider.logoUrl}
              providerName={provider.name}
            />
          </section>

          <section className="space-y-3 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-mahalo-navy-900">
              Details
            </h2>
            <ProviderEditForm
              id={provider.id}
              initialName={provider.name}
              initialColor={provider.primaryColor}
            />
          </section>
        </TabsContent>

        <TabsContent value="plans" className="pt-4">
          <PlansSection providerId={provider.id} plans={plans} />
        </TabsContent>

        <TabsContent value="add-ons" className="pt-4">
          <AddOnsSection providerId={provider.id} addOns={addOns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
