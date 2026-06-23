import { and, asc, count, eq, like } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  providerCoverage,
  providers,
  type Provider,
  type ProviderCoverage,
} from "@/lib/db/schema";

export const COVERAGE_PAGE_SIZE = 20;

export type CoveragePage = {
  rows: ProviderCoverage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listCoverageByProvider(
  providerId: string,
  opts: { search?: string; page?: number; pageSize?: number } = {},
): Promise<CoveragePage> {
  const db = getDb();
  const pageSize = opts.pageSize ?? COVERAGE_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const search = (opts.search ?? "").trim();

  const where = search
    ? and(
        eq(providerCoverage.providerId, providerId),
        like(providerCoverage.zipCode, `${search}%`),
      )
    : eq(providerCoverage.providerId, providerId);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(providerCoverage)
    .where(where);

  const rows = await db
    .select()
    .from(providerCoverage)
    .where(where)
    .orderBy(asc(providerCoverage.zipCode))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Ordinary (non-fallback) providers covering a ZIP. Fallback providers are
// excluded here on purpose; they are resolved separately and only as a
// last resort (see getAvailableProviders).
export async function findProvidersByZip(zip: string): Promise<Provider[]> {
  if (!/^\d{5}$/.test(zip)) return [];
  const db = getDb();
  const rows = await db
    .select({ provider: providers })
    .from(providerCoverage)
    .innerJoin(providers, eq(providers.id, providerCoverage.providerId))
    .where(
      and(
        eq(providerCoverage.zipCode, zip),
        eq(providers.isActive, true),
        eq(providers.isFallback, false),
      ),
    )
    .orderBy(asc(providers.name));
  return rows.map((r) => r.provider);
}

// Active fallback providers. Intentionally NOT joined to provider_coverage:
// fallback carriers are universal and offered regardless of ZIP coverage rows.
export async function listFallbackProviders(): Promise<Provider[]> {
  const db = getDb();
  return db
    .select()
    .from(providers)
    .where(and(eq(providers.isActive, true), eq(providers.isFallback, true)))
    .orderBy(asc(providers.name));
}
