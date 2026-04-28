import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { plans, type Plan } from "@/lib/db/schema";

export async function listPlansByProvider(providerId: string): Promise<Plan[]> {
  const db = getDb();
  return db
    .select()
    .from(plans)
    .where(eq(plans.providerId, providerId))
    .orderBy(asc(plans.sortOrder), asc(plans.name));
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const db = getDb();
  const rows = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return rows[0] ?? null;
}
