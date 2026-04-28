import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb, getPool } from "./client";

async function main() {
  const db = getDb();
  console.log("[db:migrate] applying migrations from ./db/migrations …");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("[db:migrate] done.");
  await getPool().end();
}

main().catch((err) => {
  console.error("[db:migrate] failed:", err);
  process.exit(1);
});
