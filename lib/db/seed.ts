import "dotenv/config";
import { closeDb, getDb } from "./client";
import { providers } from "./schema";
import { sql } from "drizzle-orm";

const seedProviders: {
  name: string;
  primaryColor: string;
  isFallback?: boolean;
}[] = [
  { name: "Kinetic", primaryColor: "#E8511C" },
  { name: "Brightspeed", primaryColor: "#FF6B00" },
  { name: "Frontier", primaryColor: "#CE2026" },
  // Last-resort carrier: only surfaced where no other provider covers the ZIP.
  { name: "EarthLink", primaryColor: "#00A651", isFallback: true },
  { name: "Optimum", primaryColor: "#005EB8" },
  { name: "Verizon Fios", primaryColor: "#CD040B" },
  { name: "AT&T", primaryColor: "#00A8E0" },
  { name: "Spectrum", primaryColor: "#0099D8" },
];

async function main() {
  try {
    const db = getDb();
    console.log("[db:seed] upserting 8 providers �");

    for (const p of seedProviders) {
      await db
        .insert(providers)
        .values({
          name: p.name,
          primaryColor: p.primaryColor,
          isActive: true,
          isFallback: p.isFallback ?? false,
        })
        .onConflictDoUpdate({
          target: providers.name,
          set: {
            primaryColor: p.primaryColor,
            isFallback: p.isFallback ?? false,
            updatedAt: sql`now()`,
          },
        });
    }

    const rows = await db.select({ id: providers.id, name: providers.name }).from(providers);
    console.log(`[db:seed] providers in DB: ${rows.length}`);
    for (const r of rows) console.log(`  - ${r.name} (${r.id})`);
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error("[db:seed] failed:", err);
  process.exit(1);
});