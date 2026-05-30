# deployment

## Purpose

Define how the Mahalo website is built, configured, and promoted to production. Production runs on **Vercel** (native Next.js integration) with a **Neon**-managed Postgres database and **Cloudflare R2** for file storage. Deploys are driven by Git pushes to the production branch; there is no Docker registry, container orchestrator, or auto-deploy webhook in the production path.

## Requirements

### Requirement: Production deployment on Vercel
The system SHALL deploy the application to production using Vercel's native Next.js integration, driven by Git pushes to the production branch. The repository SHALL NOT depend on a Docker image, a Docker image registry, a self-hosted container orchestrator, or an external auto-deploy webhook for production deploys, and SHALL NOT ship a `Dockerfile` or `docker-compose` manifest as part of the deployment path.

#### Scenario: Push to the production branch deploys
- **WHEN** a commit is pushed or merged to the production branch connected to the Vercel project
- **THEN** Vercel SHALL install dependencies with pnpm (resolved from `packageManager` in `package.json`), run `pnpm run build`, and promote the resulting build to production on success.

#### Scenario: Build failure does not promote
- **WHEN** the Vercel build step exits with a non-zero status
- **THEN** Vercel SHALL fail the deployment, SHALL keep the previously promoted production deployment serving traffic, and SHALL NOT expose the failed build.

### Requirement: Managed Postgres on Neon
The production database SHALL be a Neon-managed Postgres instance, connected through the `@neondatabase/serverless` driver with Drizzle's `neon-serverless` adapter. The application runtime SHALL connect using a **pooled** Neon connection string so that Vercel serverless execution does not exhaust direct connections.

#### Scenario: Runtime uses the pooled connection
- **WHEN** the deployed application performs a database query
- **THEN** it SHALL connect through `DATABASE_URL`, which SHALL be a pooled Neon connection string (host including `-pooler`, `sslmode=require`).

#### Scenario: Missing database URL fails fast
- **WHEN** the application starts without `DATABASE_URL` configured
- **THEN** the application SHALL fail on the first database access with a clear error indicating the missing variable, rather than silently using a default.

### Requirement: Runtime environment variables on Vercel
The deployed application SHALL receive all runtime configuration through Vercel project environment variables. None of these values SHALL be committed to the repository or baked into any build artifact. The variable set SHALL include at minimum: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `DRAFT_COOKIE_SECRET`, `ADMIN_BOOTSTRAP_EMAILS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `USPS_API_BASE`, `USPS_CONSUMER_KEY`, `USPS_CONSUMER_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.

#### Scenario: Secrets are not present in the repository
- **WHEN** an engineer inspects the committed repository
- **THEN** there SHALL be no `.env`, `.env.local`, or other file holding production secrets, and all secret values SHALL exist only in the Vercel environment variables panel.

#### Scenario: Direct connection string drives operational tooling
- **WHEN** migrations or Drizzle Kit run
- **THEN** they SHALL use `DIRECT_DATABASE_URL` (a non-pooled Neon connection string), falling back to `DATABASE_URL` only when `DIRECT_DATABASE_URL` is not set.

### Requirement: Migrations run outside the build pipeline
Database migrations SHALL NOT run automatically during Vercel builds. Schema changes are infrastructure operations and SHALL be executed deliberately from a trusted machine or CI job using `DIRECT_DATABASE_URL`.

#### Scenario: Operator runs a migration
- **WHEN** a release includes schema changes
- **THEN** an operator SHALL run `DIRECT_DATABASE_URL="postgresql://..." pnpm run db:migrate` against Neon production before or during the release window, and the Vercel build SHALL NOT have executed any migration command.

#### Scenario: Build does not migrate
- **WHEN** a Vercel production deploy completes
- **THEN** no migration command SHALL have been executed by the build or by the running application at startup.

### Requirement: Deployment documentation single source of truth
A document at `docs/deployment.md` SHALL describe the Vercel + Neon + Cloudflare R2 production architecture and SHALL list every environment variable consumed at runtime or build time, classify where each one is configured, state where to obtain its value, and provide runbooks for first deploy, normal deploy, manual migration, and rollback.

#### Scenario: Onboarding a new operator
- **WHEN** a new operator needs to deploy for the first time
- **THEN** following `docs/deployment.md` end-to-end SHALL be sufficient to provision Neon, the Vercel project, Cloudflare R2, Clerk, Resend, and USPS credentials, configure the Vercel environment variables, and trigger a first successful production deploy.

#### Scenario: Rollback procedure is documented
- **WHEN** a production release must be reverted
- **THEN** `docs/deployment.md` SHALL describe promoting a previous successful Vercel deployment and the schema-compatibility check required when the failed release included migrations.
