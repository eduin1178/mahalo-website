import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { providers, type Provider } from "@/lib/db/schema";

export async function listProviders(): Promise<Provider[]> {
  const db = getDb();
  return db.select().from(providers).orderBy(asc(providers.name));
}

export async function getProviderById(id: string): Promise<Provider | null> {
  const db = getDb();
  const rows = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return rows[0] ?? null;
}
