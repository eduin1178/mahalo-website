import "dotenv/config";
import { getDb, getPool } from "./client";
import { providers } from "./schema";
import { sql } from "drizzle-orm";

const seedProviders = [
  { name: "Kinetic", primaryColor: "#E8511C" },
  { name: "Brightspeed", primaryColor: "#FF6B00" },
  { name: "Frontier", primaryColor: "#CE2026" },
  { name: "EarthLink", primaryColor: "#00A651" },
  { name: "Optimum", primaryColor: "#005EB8" },
  { name: "Verizon Fios", primaryColor: "#CD040B" },
  { name: "AT&T", primaryColor: "#00A8E0" },
  { name: "Spectrum", primaryColor: "#0099D8" },
];

async function main() {
  const db = getDb();
  console.log("[db:seed] upserting 8 providers …");

  for (const p of seedProviders) {
    await db
      .insert(providers)
      .values({ name: p.name, primaryColor: p.primaryColor, isActive: true })
      .onConflictDoUpdate({
        target: providers.name,
        set: { primaryColor: p.primaryColor, updatedAt: sql`now()` },
      });
  }

  const rows = await db.select({ id: providers.id, name: providers.name }).from(providers);
  console.log(`[db:seed] providers in DB: ${rows.length}`);
  for (const r of rows) console.log(`  - ${r.name} (${r.id})`);

  await getPool().end();
}

main().catch((err) => {
  console.error("[db:seed] failed:", err);
  process.exit(1);
});
