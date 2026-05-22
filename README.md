# Mahalo Enterprise

Internet plan reseller platform: public landing + 8-step checkout funnel + admin back-office.

Stack: Next.js 16 (App Router) · Tailwind v4 · shadcn/ui · PostgreSQL · Drizzle · Clerk · Resend · Docker.

Documentación canónica en [`specs/`](specs/). Para implementar tareas usar la skill `/implement` (ver [`AGENTS.md`](AGENTS.md)).

Para desplegar a producción (Dokploy + Docker Hub + Cloudflare R2) consultar [`docs/deployment.md`](docs/deployment.md).

## Local development

### Option A — Docker (recommended)

Requires Docker Desktop.

```bash
cp .env.example .env
# fill in CLERK_*, RESEND_*, USPS_* if needed
docker compose up --build
```

App at <http://localhost:3000>, Postgres on `localhost:5432`.

Volumes:
- `pg_data` — Postgres data.
- `uploads` — provider logos served from `/public/uploads`.

### Option B — Node directly

Requires Node 22+ and a running Postgres.

```bash
cp .env.example .env
pnpm install
pnpm run dev
```

## Useful scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Next.js dev server (Turbopack). |
| `pnpm run build` | Production build (Next standalone output). |
| `pnpm run start` | Run the production server. |
| `pnpm run lint` | ESLint. |

## Project layout

See [`specs/plan.md`](specs/plan.md) §3.
