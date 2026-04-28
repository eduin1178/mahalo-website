import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DrizzleDb = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __mahaloPgPool?: Pool;
  __mahaloDb?: DrizzleDb;
};

export function getPool(): Pool {
  if (!globalForDb.__mahaloPgPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    globalForDb.__mahaloPgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return globalForDb.__mahaloPgPool;
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

export { schema };
