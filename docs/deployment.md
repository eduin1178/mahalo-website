# Deployment guide � Mahalo Website

> Production deployment runbook for **Vercel + Neon + Cloudflare R2**.
> Production deploys use Vercel's native Next.js integration. The repository no longer ships Docker artifacts; the previous Docker Hub + Dokploy pipeline has been removed.

## 1. Architecture

```
GitHub
  -> Vercel project
        -> Next.js 16 app runtime
        -> Environment variables
        -> Server Actions / Server Components
              -> Neon Postgres

Cloudflare R2
  -> Public provider logo storage via R2_PUBLIC_BASE_URL
```

Neon replaces the previous Dokploy-managed Postgres service. Vercel replaces the previous Docker Hub + Dokploy deployment pipeline.

## 2. External prerequisites

Provision these before the first production deploy:

| # | Service | What to create |
|---|---------|----------------|
| 1 | **Neon** | Project, production branch, database, role, pooled connection string, direct connection string |
| 2 | **Vercel** | Project connected to this GitHub repository |
| 3 | **Cloudflare R2** | Bucket, S3 credentials, public bucket URL or custom domain |
| 4 | **Clerk** | Production instance or production keys |
| 5 | **Resend** | API key and verified sender/domain |
| 6 | **USPS API** | Production or sandbox API credentials |

## 3. Environment variables

### 3.1 Vercel variables

Configure these in Vercel -> Project -> Settings -> Environment Variables.

| Variable | Required | Notes |
|---|---:|---|
| `DATABASE_URL` | Yes | Neon **pooled** connection string. Host should include `-pooler` and `sslmode=require`. Used by the app runtime. |
| `DIRECT_DATABASE_URL` | Recommended | Neon **direct** connection string, without `-pooler`. Used by migrations and Drizzle Kit. Falls back to `DATABASE_URL` if omitted. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public production URL, e.g. `https://mahalo.example.com`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key. |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Recommended | `/admin/sign-in` unless changed. |
| `DRAFT_COOKIE_SECRET` | Yes | Random 32+ byte secret for signed checkout draft cookies. |
| `ADMIN_BOOTSTRAP_EMAILS` | Recommended | Comma-separated admin emails. |
| `RESEND_API_KEY` | Yes | Resend API key. |
| `RESEND_FROM_EMAIL` | Yes | Verified sender email. |
| `USPS_API_BASE` | Yes | USPS API base URL. |
| `USPS_CONSUMER_KEY` | Yes | USPS consumer key. |
| `USPS_CONSUMER_SECRET` | Yes | USPS consumer secret. |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID. |
| `R2_ACCESS_KEY_ID` | Yes | R2 S3 access key. |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 S3 secret key. |
| `R2_BUCKET` | Yes | R2 bucket name. |
| `R2_PUBLIC_BASE_URL` | Yes | Public bucket URL, without trailing slash. |

### 3.2 Neon connection strings

Use two URLs when possible:

- `DATABASE_URL`: pooled Neon URL for the web app.
- `DIRECT_DATABASE_URL`: direct Neon URL for migrations.

Example shapes:

```bash
DATABASE_URL="postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@ep-example.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

Do not commit real credentials.

## 4. Vercel project settings

Use the default Vercel Next.js settings unless there is a specific reason to override them.

| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Install command | Auto-detected from `packageManager`; expected pnpm |
| Build command | `pnpm run build` |
| Output directory | Auto |
| Node.js version | 22.x, as declared in `package.json` |

## 5. Database migration runbook

Migrations are intentionally **not** run automatically during Vercel builds. Schema changes are infrastructure operations, not frontend build steps.

Run migrations from a trusted machine or CI job that has `DIRECT_DATABASE_URL` configured:

```bash
DIRECT_DATABASE_URL="postgresql://..." pnpm run db:migrate
```

The migration script prefers `DIRECT_DATABASE_URL` and falls back to `DATABASE_URL`.

Recommended release order when a deploy includes schema changes:

1. Review generated migration files in `db/migrations`.
2. Run `pnpm run db:migrate` against Neon production using `DIRECT_DATABASE_URL`.
3. Deploy the Vercel application.
4. Smoke test the public landing, checkout flow, admin login, provider logo upload, and order email/webhook flow.

## 6. Normal deploy

1. Push or merge to the production branch connected to Vercel.
2. Vercel installs with pnpm and builds the Next.js app.
3. The runtime connects to Neon through `DATABASE_URL`.
4. If the release includes migrations, run the migration runbook before or during the release window.

## 7. Rollback

1. Use Vercel's deployment rollback to promote a previous successful deployment.
2. If the failed release included schema changes, verify whether the previous app version is compatible with the current schema before rollback.
3. If needed, run a manual reverse migration or restore Neon from backup/point-in-time recovery.

## 8. Notes and limits

- The app uses `@neondatabase/serverless` with Drizzle's `neon-serverless` driver because the codebase uses transactions.
- `DATABASE_URL` should be pooled in production to reduce connection pressure from Vercel serverless execution.
- `DIRECT_DATABASE_URL` should be reserved for migrations and operational scripts.
- R2 public URLs are intended for provider logos. Do not store private files in the public bucket without redesigning the storage layer.
- The old Docker Hub + Dokploy workflow has been removed; Vercel should own production deployments now.
### R2 uploaded logo troubleshooting

Provider logos uploaded to R2 are rendered with a plain HTML `<img>` instead of `next/image` so they do not depend on Next's build-time `images.remotePatterns`.

If an uploaded logo does not render:

1. Copy the saved `providers.logoUrl` from the database or admin UI.
2. Open it directly in a private browser window.
3. If the direct URL returns 403 or 404, fix Cloudflare R2 public access, `R2_PUBLIC_BASE_URL`, or the stored object key.
4. If the direct URL returns 200 but the app is broken, inspect app HTML/CSS/cache rather than the upload path.
