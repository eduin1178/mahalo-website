import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

type DrizzleDb = NeonDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __mahaloNeonPool?: Pool;
  __mahaloDb?: DrizzleDb;
  __mahaloNeonConfigured?: boolean;
};

function configureNeonDriver(): void {
  if (globalForDb.__mahaloNeonConfigured) return;
  neonConfig.webSocketConstructor = ws;
  globalForDb.__mahaloNeonConfigured = true;
}

export function getPool(): Pool {
  configureNeonDriver();

  if (!globalForDb.__mahaloNeonPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    globalForDb.__mahaloNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return globalForDb.__mahaloNeonPool;
}

export function getDb(): DrizzleDb {
  if (!globalForDb.__mahaloDb) {
    globalForDb.__mahaloDb = drizzle(getPool(), { schema });
  }
  return globalForDb.__mahaloDb;
}

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_t, prop, receiver) {
    return Reflect.get(getDb() as unknown as object, prop, receiver);
  },
});

export async function closeDb(): Promise<void> {
  if (globalForDb.__mahaloNeonPool) {
    await globalForDb.__mahaloNeonPool.end();
    globalForDb.__mahaloNeonPool = undefined;
    globalForDb.__mahaloDb = undefined;
  }
}

export { schema };
