import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { addOns, type AddOn } from "@/lib/db/schema";

export async function listAddOnsByProvider(providerId: string): Promise<AddOn[]> {
  const db = getDb();
  return db
    .select()
    .from(addOns)
    .where(eq(addOns.providerId, providerId))
    .orderBy(asc(addOns.name));
}

export async function getAddOnById(id: string): Promise<AddOn | null> {
  const db = getDb();
  const rows = await db.select().from(addOns).where(eq(addOns.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function providerHasActiveAddOns(providerId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: addOns.id })
    .from(addOns)
    .where(and(eq(addOns.providerId, providerId), eq(addOns.isActive, true)))
    .limit(1);
  return rows.length > 0;
}
