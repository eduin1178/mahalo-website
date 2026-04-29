import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { plans, type Plan, type Provider } from "@/lib/db/schema";
import { validateAddress, type ValidateAddressErrorCode } from "@/lib/usps/client";

import { findProvidersByZip } from "./queries";

export type AvailableProvider = {
  provider: Provider;
  plans: Plan[];
};

export type AvailabilityOk = {
  ok: true;
  zip: string;
  providers: AvailableProvider[];
};

export type AvailabilityError = {
  ok: false;
  error: { code: ValidateAddressErrorCode; message: string };
};

export type AvailabilityResult = AvailabilityOk | AvailabilityError;

export async function getAvailableProviders(
  input: string,
): Promise<AvailabilityResult> {
  const validation = await validateAddress(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const zip = validation.zip;
  const coveredProviders = await findProvidersByZip(zip);

  if (coveredProviders.length === 0) {
    return { ok: true, zip, providers: [] };
  }

  const providerIds = coveredProviders.map((p) => p.id);
  const db = getDb();
  const activePlans = await db
    .select()
    .from(plans)
    .where(and(inArray(plans.providerId, providerIds), eq(plans.isActive, true)))
    .orderBy(asc(plans.sortOrder), asc(plans.name));

  const plansByProvider = new Map<string, Plan[]>();
  for (const plan of activePlans) {
    const list = plansByProvider.get(plan.providerId) ?? [];
    list.push(plan);
    plansByProvider.set(plan.providerId, list);
  }

  const result: AvailableProvider[] = coveredProviders
    .map((provider) => ({
      provider,
      plans: plansByProvider.get(provider.id) ?? [],
    }))
    .filter((entry) => entry.plans.length > 0);

  return { ok: true, zip, providers: result };
}
