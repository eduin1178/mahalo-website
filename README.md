# Mahalo Enterprise

Internet plan reseller platform: public landing + 8-step checkout funnel + admin back-office.

Stack: Next.js 16 (App Router) · Tailwind v4 · shadcn/ui · Neon Postgres · Drizzle · Clerk · Resend · Cloudflare R2.

Documentación canónica en [`specs/`](specs/). Para implementar tareas usar la skill `/implement` (ver [`AGENTS.md`](AGENTS.md)).

Para desplegar a producción (Vercel + Neon + Cloudflare R2) consultar [`docs/deployment.md`](docs/deployment.md).

## Local development

Requires Node 22+ and a Neon database URL in `.env`.

```bash
cp .env.example .env
# set DATABASE_URL to your Neon pooled connection string
# set DIRECT_DATABASE_URL to your Neon direct connection string for migrations
pnpm install
pnpm run dev
```

App at <http://localhost:3000>.

## Useful scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Next.js dev server. |
| `pnpm run build` | Production build. |
| `pnpm run start` | Run the production server. |
| `pnpm run lint` | ESLint. |
| `pnpm run db:migrate` | Apply Drizzle migrations. Uses `DIRECT_DATABASE_URL` when set. |
| `pnpm run db:seed` | Seed provider data. |

## Project layout

See [`specs/plan.md`](specs/plan.md) §3.