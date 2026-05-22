# Deployment guide — Mahalo Website

> Production deployment runbook. The repository's `docker-compose.yml` is **dev-only**; production uses Dokploy + Docker Hub + Cloudflare R2.

## 1. Architecture

```
GitHub (push master/dev)
    └─▶ GitHub Actions
          build → Docker Hub (DOCKERHUB_USERNAME/mahalo-website:<tag>)
                   │
                   └─▶ POST DOKPLOY_DEPLOY_WEBHOOK
                        └─▶ Dokploy: pull image + redeploy

Dokploy project: "mahalo"
  ├── Postgres service       (Dokploy Database, internal network only)
  └── App service            (Dokploy Compose, reads docker-compose.dokploy.yml
                              from the repo, pulls image from Docker Hub)

Cloudflare R2
  └── Bucket: <R2_BUCKET>  (user uploads, public via R2_PUBLIC_BASE_URL)
```

## 2. External prerequisites

Before the first deploy, provision (in this order):

| # | Service | What to create |
|---|---------|----------------|
| 1 | **Cloudflare R2** | Account → R2 bucket → API token (S3 credentials) → enable public access (`pub-*.r2.dev`) or attach custom domain |
| 2 | **Docker Hub** | Account → public repository `mahalo-website` → Access Token (Read & Write) |
| 3 | **Dokploy** | Project "mahalo" → Postgres service (internal, no public port) → Application service (Docker image deploy) |
| 4 | **GitHub** | Repository secrets configured (see §4) |

## 3. Environment variables

### 3.1 Where each variable belongs

| Variable | Configured in | Purpose |
|---|---|---|
| `DOCKERHUB_USERNAME` | GitHub Actions secrets | Docker Hub login for the workflow |
| `DOCKERHUB_TOKEN` | GitHub Actions secrets | Docker Hub access token (not your password) |
| `DOKPLOY_DEPLOY_WEBHOOK` | GitHub Actions secrets | Auto-deploy webhook URL from Dokploy |
| `DATABASE_URL` | Dokploy app env | Postgres connection string (internal hostname) |
| `NEXT_PUBLIC_APP_URL` | Dokploy app env | Public app URL, e.g. `https://mahalo.example.com` |
| `CLERK_SECRET_KEY` | Dokploy app env | Clerk server-side secret |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Dokploy app env | Clerk client publishable key |
| `DRAFT_COOKIE_SECRET` | Dokploy app env | Random 32+ char string for signed cookies |
| `RESEND_API_KEY` | Dokploy app env | Resend transactional email API key |
| `RESEND_FROM_EMAIL` | Dokploy app env | Verified sender email |
| `ADMIN_BOOTSTRAP_EMAILS` | Dokploy app env | Comma-separated emails granted admin on first login |
| `USPS_API_BASE` | Dokploy app env | USPS API base URL (e.g. `https://apis.usps.com`) |
| `USPS_CONSUMER_KEY` | Dokploy app env | USPS OAuth consumer key |
| `USPS_CONSUMER_SECRET` | Dokploy app env | USPS OAuth consumer secret |
| `R2_ACCOUNT_ID` | Dokploy app env | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Dokploy app env | R2 S3 API access key |
| `R2_SECRET_ACCESS_KEY` | Dokploy app env | R2 S3 API secret |
| `R2_BUCKET` | Dokploy app env | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Dokploy app env | Public base URL of the bucket, e.g. `https://pub-<hash>.r2.dev` |
| `DOCKER_IMAGE` | Dokploy app env | Image reference used by `docker-compose.dokploy.yml`, e.g. `<dockerhub-username>/mahalo-website:latest`. Change to `:sha-<commit>` for rollback. |

### 3.2 Where to obtain each value

- **Docker Hub token**: hub.docker.com → Account Settings → Security → New Access Token (scope: Read & Write).
- **Dokploy webhook**: Dokploy → App → Deployments → Auto Deploy → Generate Webhook URL.
- **Cloudflare R2 credentials**: dash.cloudflare.com → R2 → "Manage R2 API Tokens" → Create API Token (Object Read & Write, scoped to the bucket). Copy `Access Key ID` and `Secret Access Key`.
- **Cloudflare account ID**: dash.cloudflare.com → R2 dashboard → right-hand side panel shows the Account ID.
- **R2 bucket / public URL**: R2 dashboard → bucket → Settings → "Public access" → enable r2.dev subdomain (or attach a custom domain).
- **Clerk keys**: dashboard.clerk.com → API Keys.
- **Resend API key**: resend.com → API Keys.
- **USPS keys**: developer.usps.com → your app → Consumer Key / Consumer Secret.
- **DATABASE_URL**: Dokploy → Postgres service → "Internal connection" string (typically `postgres://<user>:<pwd>@<service-host>:5432/<db>`).
- **DRAFT_COOKIE_SECRET**: generate locally with `openssl rand -hex 32`.

## 4. First deploy runbook

1. **Provision Cloudflare R2** (bucket + API token + enable public access). Note `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.
2. **Create Docker Hub repo** `mahalo-website` and an Access Token.
3. **In GitHub** → repo → Settings → Secrets and variables → Actions → add `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. (Leave `DOKPLOY_DEPLOY_WEBHOOK` for now.)
4. **Merge to `master`**. Wait for the GitHub Actions workflow to publish the first image. Confirm the image appears in Docker Hub.
5. **In Dokploy**:
   - Create Project "mahalo".
   - Create **Database service → PostgreSQL 16**. Use a strong password (record it). Do **not** expose a public port. Note the internal service hostname (e.g. `mahalo-db`) and the internal connection string.
   - Create **Compose service** (NOT "Application/Docker Image"):
     - Source: connect this GitHub repository (install the Dokploy GitHub App if needed; grant access to the private repo).
     - Branch: `master`.
     - Compose path: `docker-compose.dokploy.yml`.
     - Service to expose: `app`, port `3000`.
     - Domain: attach your domain (Dokploy provisions TLS via Traefik).
     - Environment variables: fill every row from §3.1 except the three GitHub secrets. Add an extra var `DOCKER_IMAGE=<dockerhub-username>/mahalo-website:latest` so the compose file resolves the image reference.
6. **Run the initial database migration** following §5.
7. **In Dokploy** → App → Deployments → Auto Deploy → generate webhook URL. Copy it.
8. **In GitHub** → repo secrets → add `DOKPLOY_DEPLOY_WEBHOOK`.
9. **Manually trigger the first deploy** in Dokploy (or push a trivial commit so the workflow runs end-to-end and fires the webhook).
10. **Smoke test**: open `NEXT_PUBLIC_APP_URL`, sign in, upload a provider logo to confirm R2 wiring.

## 5. Database migration runbook (manual, temporary port exposure)

Migrations are intentionally **not** run by the deploy pipeline or by the container at startup. Execute them from your local machine with the steps below.

### Checklist

- [ ] **Open the Postgres port temporarily**
  Dokploy → Postgres service → Settings → enable a public port (e.g. `5434`). Optionally restrict by source IP if supported.
- [ ] **Construct a one-off `DATABASE_URL`**
  Format: `postgres://<user>:<password>@<dokploy-host>:<exposed-port>/<db>`.
  Example: `postgres://mahalo:supersecret@dokploy.example.com:5434/mahalo`.
- [ ] **Run the migration from your local checkout**
  ```bash
  DATABASE_URL="postgres://..." pnpm run db:migrate
  ```
  Confirm the command exits with status 0 and prints the applied migrations.
- [ ] **Verify**: connect with `psql` (or a GUI) using the same URL and inspect a key table to confirm the schema matches expectations.
- [ ] **Close the public port in Dokploy** → Postgres service → disable the public port.
- [ ] **Confirm the port is closed**: from your local machine run `nc -vz <dokploy-host> <port>` (or `Test-NetConnection`); it MUST refuse the connection.

Repeat this checklist for every future migration release.

## 6. Normal redeploy

1. Merge to `master`.
2. GitHub Actions builds, pushes `latest` + `sha-<short>`, calls the Dokploy webhook.
3. Dokploy pulls the new image and restarts the app service.
4. No manual action is required unless the release ships a new migration — in that case, run §5 **before** the merge (or immediately after, accepting brief downtime).

## 7. Rollback

1. Identify the previous good commit SHA (from `git log` or Docker Hub tags).
2. In Dokploy → App (Compose) → Environment → change `DOCKER_IMAGE` from `<user>/mahalo-website:latest` to `<user>/mahalo-website:sha-<previous-short>` and redeploy.
3. If the bad release included a migration, roll back the schema manually following §5 (running the inverse migration or restoring from backup) before reverting the image — otherwise the older code may not be compatible with the newer schema.

## 8. Notes & limits

- Docker Hub repo is **public**. The image contains compiled Next.js output (no secrets). Verify with `docker run --rm <image> ls -la /app` after a fresh build.
- R2 bucket served via public URL: do **not** put sensitive files there without revisiting the storage module.
- The local `docker-compose.yml` is **dev-only**; never deploy it to production.
