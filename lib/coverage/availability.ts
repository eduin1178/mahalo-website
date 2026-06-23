import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { plans, type Plan, type Provider } from "@/lib/db/schema";

import { findProvidersByZip, listFallbackProviders } from "./queries";

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
  error: { code: "invalid_format"; message: string };
};

export type AvailabilityResult = AvailabilityOk | AvailabilityError;

// Attach each provider's active plans and drop providers that have none. Shared
// by both the ordinary and fallback resolution branches so the "must have active
// plans" rule applies uniformly.
async function withActivePlans(
  candidates: Provider[],
): Promise<AvailableProvider[]> {
  if (candidates.length === 0) return [];

  const providerIds = candidates.map((p) => p.id);
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

  return candidates
    .map((provider) => ({
      provider,
      plans: plansByProvider.get(provider.id) ?? [],
    }))
    .filter((entry) => entry.plans.length > 0);
}

export async function getAvailableProviders(
  input: string,
): Promise<AvailabilityResult> {
  const zip = input.trim();

  // Availability is resolved purely from the database; format is the only ZIP
  // gate (no external address service). A malformed ZIP can't match any
  // coverage row, so return an empty set and let callers render the empty
  // state rather than surfacing a lookup error.
  if (!/^\d{5}$/.test(zip)) {
    return { ok: true, zip, providers: [] };
  }

  // Ordinary (non-fallback) providers covering this ZIP take precedence.
  const ordinary = await withActivePlans(await findProvidersByZip(zip));
  if (ordinary.length > 0) {
    return { ok: true, zip, providers: ordinary };
  }

  // No ordinary coverage: fall back to last-resort carriers (universal — they
  // are offered even though this ZIP is absent from their coverage rows).
  const fallback = await withActivePlans(await listFallbackProviders());
  return { ok: true, zip, providers: fallback };
}
