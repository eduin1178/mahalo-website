import "dotenv/config";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { closeDb, getDb } from "./client";

async function main() {
  try {
    if (process.env.DIRECT_DATABASE_URL) {
      process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
    }

    const db = getDb();
    console.log("[db:migrate] applying migrations from ./db/migrations …");
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("[db:migrate] done.");
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error("[db:migrate] failed:", err);
  process.exit(1);
});
