## ADDED Requirements

### Requirement: Docker image build pipeline on GitHub Actions
The system SHALL build the application's production Docker image automatically on every push to release branches (`master` and `dev`) via a GitHub Actions workflow stored at `.github/workflows/docker-publish.yml`.

#### Scenario: Push to master triggers a build
- **WHEN** a commit is pushed to the `master` branch
- **THEN** GitHub Actions SHALL check out the repository, set up Docker Buildx, log in to Docker Hub using the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets, build the image from the repository `Dockerfile`, and push it to Docker Hub.

#### Scenario: Build failure aborts the publish
- **WHEN** the `docker build` step exits with a non-zero status
- **THEN** the workflow SHALL fail the job, SHALL NOT push any image to Docker Hub, and SHALL NOT call the auto-deploy webhook.

### Requirement: Image tagging strategy
Every successful build SHALL publish at least two tags to Docker Hub: an immutable `sha-<short-commit-sha>` tag and a moving `latest` tag for the default release branch (`master`). Builds from non-default release branches (`dev`) SHALL publish a moving tag named after the branch (`dev`) and the corresponding `sha-<short-commit-sha>` tag, but SHALL NOT update `latest`.

#### Scenario: Master push produces immutable and latest tags
- **WHEN** the workflow runs on a `master` push with commit SHA `abc1234`
- **THEN** the workflow SHALL push both `<repo>:sha-abc1234` and `<repo>:latest` to Docker Hub.

#### Scenario: Dev push does not update latest
- **WHEN** the workflow runs on a `dev` push with commit SHA `def5678`
- **THEN** the workflow SHALL push `<repo>:sha-def5678` and `<repo>:dev` but SHALL NOT push `<repo>:latest`.

### Requirement: Auto-deploy webhook to Dokploy
After a successful push of the `latest` (or `dev`) tag, the workflow SHALL issue an HTTP POST to the Dokploy auto-deploy webhook URL stored in the `DOKPLOY_DEPLOY_WEBHOOK` repository secret so that Dokploy pulls the new image and redeploys the service.

#### Scenario: Successful publish triggers redeploy
- **WHEN** all `docker push` steps succeed for a `master` build
- **THEN** the workflow SHALL POST to `${{ secrets.DOKPLOY_DEPLOY_WEBHOOK }}` and SHALL mark the job as successful if the webhook responds with a 2xx status code.

#### Scenario: Webhook secret is missing
- **WHEN** the `DOKPLOY_DEPLOY_WEBHOOK` secret is not configured
- **THEN** the webhook step SHALL be skipped (not fail the job) and the workflow SHALL log a warning so operators can deploy manually from Dokploy.

### Requirement: Production deploy uses pre-built image
The production environment SHALL deploy the application by pulling the Docker Hub image referenced above. The repository's `docker-compose.yml` SHALL NOT be used as the production deployment manifest; it SHALL be reserved for local development only and SHALL NOT contain any services that must run in production.

#### Scenario: Local compose has no production database
- **WHEN** an engineer inspects `docker-compose.yml` at the repository root
- **THEN** the file SHALL declare only services intended for local development (e.g., a Postgres for local work) and SHALL be documented as a dev-only artifact.

#### Scenario: Production database is provisioned in Dokploy
- **WHEN** the application is deployed to Dokploy
- **THEN** Postgres SHALL be provisioned as a Dokploy-native database service inside the same Dokploy project as the application, and the application SHALL connect to it over the project's internal network using the `DATABASE_URL` environment variable.

### Requirement: Runtime environment variables for the deployed app
The deployed Dokploy application service SHALL receive the following environment variables, all set on the Dokploy app's environment panel: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `DRAFT_COOKIE_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_BOOTSTRAP_EMAILS`, `USPS_API_BASE`, `USPS_CONSUMER_KEY`, `USPS_CONSUMER_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. None of these values SHALL be baked into the Docker image.

#### Scenario: Image contains no production secrets
- **WHEN** an engineer inspects the built Docker image's layers or the build context
- **THEN** the image SHALL NOT contain `.env`, `.env.local`, or any file holding production secrets, because `.dockerignore` SHALL exclude `.env*`.

#### Scenario: Missing required runtime variable
- **WHEN** the application starts in Dokploy without `DATABASE_URL` configured
- **THEN** the application SHALL fail fast on the first DB access with a clear error indicating the missing variable, rather than silently using a default.

### Requirement: Manual database migration runbook
Database migrations SHALL NOT run automatically as part of the deploy pipeline. The repository SHALL document a runbook in `docs/deployment.md` describing how to expose the Dokploy Postgres port temporarily, run `npm run db:migrate` from a local machine against that exposed port using a one-off `DATABASE_URL`, and revert the port exposure afterward.

#### Scenario: Operator follows the runbook
- **WHEN** an operator opens `docs/deployment.md`
- **THEN** they SHALL find an ordered checklist that covers (a) enabling the external port on the Dokploy Postgres service, (b) constructing the temporary `DATABASE_URL`, (c) running the migration command locally, (d) verifying the result, and (e) disabling the external port again.

#### Scenario: Pipeline does not migrate
- **WHEN** a successful deploy completes via the GitHub Actions → Docker Hub → Dokploy webhook path
- **THEN** no migration command SHALL have been executed by the workflow or by the running container at startup.

### Requirement: Deployment documentation single source of truth
A document at `docs/deployment.md` SHALL list every environment variable consumed at runtime or build time, classify each one (GitHub Actions secret vs Dokploy app env vs Cloudflare configuration), state where to obtain the value, and link to the relevant external dashboard (Docker Hub, Cloudflare R2, Clerk, Resend, USPS, Dokploy).

#### Scenario: Onboarding a new operator
- **WHEN** a new operator needs to deploy for the first time
- **THEN** following `docs/deployment.md` end-to-end SHALL be sufficient to provision Docker Hub, Cloudflare R2, the Dokploy project (Postgres + app), the GitHub Actions secrets, and trigger a first successful deploy.
