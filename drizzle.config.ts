import { defineConfig } from "drizzle-kit";

// Load local env files when the CLI is run without inline env (e.g. `pnpm
// db:migrate` on a dev machine). When env is provided inline — as in CI and the
// deploy flow (`DIRECT_DATABASE_URL="..." pnpm db:migrate`) — this is skipped so
// the inline values win. Uses Node's built-in loader, so there is no `dotenv`
// dependency.
if (!process.env.DIRECT_DATABASE_URL && !process.env.DATABASE_URL) {
  for (const file of [".env", ".env.local"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // File not present — ignore and fall through to the next one.
    }
  }
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://mahalo:mahalo@localhost:5432/mahalo",
  },
  strict: true,
  verbose: true,
});
