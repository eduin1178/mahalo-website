> **Nota de archivo (2026-05-29):** la propuesta original planteaba el deploy sobre **Dokploy + Docker Hub + GitHub Actions**. Ese approach fue **descartado**: la aplicación se despliega en **Vercel + Neon + Cloudflare R2**. La capacidad `file-storage` (R2) se implementó tal como se propuso; la capacidad `deployment` se reescribió para reflejar Vercel/Neon antes de sincronizar a las main specs. Este texto se conserva como registro histórico de la intención inicial.

## Why

El proyecto no tiene una infraestructura de despliegue definida ni un pipeline de build automatizado: hoy depende de un `docker-compose.yml` local que mezcla app y base de datos, los uploads se guardan en disco efímero (`./public/uploads`) y no existe estrategia para promover cambios a un entorno productivo. Necesitamos un camino reproducible, idempotente y trazable para llevar la aplicación a Dokploy, con la base de datos como servicio gestionado, imágenes versionadas en un registry público y storage de archivos resistente a redeploys.

## What Changes

- **NUEVO** workflow de GitHub Actions (`.github/workflows/docker-publish.yml`) que construye la imagen Docker en cada push a las ramas de release, la publica a Docker Hub con tags `latest` y `sha-<commit>`, y dispara el webhook de auto-deploy de Dokploy al finalizar.
- **BREAKING** el `docker-compose.yml` del repo deja de servir como definición de producción. Se reescribe como compose de desarrollo local (queda como `docker-compose.yml` pero documentado como solo-dev) y la base de datos productiva se crea como servicio nativo de Dokploy, fuera del compose de la app.
- **BREAKING** la capa de uploads se migra de filesystem local (`./public/uploads`) a Cloudflare R2 vía cliente S3-compatible. Se elimina el `mkdir public/uploads` del `Dockerfile`. Cualquier código que escriba o lea desde `public/uploads` pasa a usar los helpers nuevos de R2.
- **NUEVO** módulo de storage en `lib/storage/` que expone `upload`, `getPublicUrl` y `delete` apuntando a R2; `next.config.ts` se actualiza para autorizar el dominio público del bucket en `images.remotePatterns`.
- **NUEVO** procedimiento documentado para ejecutar migraciones manualmente desde la CLI local contra el Postgres de Dokploy, exponiendo el puerto temporalmente y revirtiendo el cambio al terminar.
- **NUEVO** `.dockerignore` (o revisión del existente) para excluir `.env*`, `node_modules`, `.next`, `.git` y evitar fugas o imágenes infladas.
- **NUEVA** guía de despliegue en `docs/deployment.md` con: inventario completo de variables de entorno, de dónde se obtiene cada una, dónde se configura (GitHub Secrets vs Dokploy app env vs Cloudflare), y los runbooks de primer deploy, redeploy y migración manual.

## Capabilities

### New Capabilities
- `deployment`: pipeline de build de imagen Docker en GitHub Actions, publicación a Docker Hub, deploy en Dokploy (app + Postgres como servicios separados), variables de entorno y procedimiento de migración manual.
- `file-storage`: capa de almacenamiento de archivos basada en Cloudflare R2 (S3-compatible) que reemplaza el filesystem local para uploads de la aplicación.

### Modified Capabilities
<!-- No hay specs existentes cuyos requisitos cambien; los cambios en checkout-wizard / public-landing son solo el reemplazo de la implementación de uploads, no de su contrato. -->

## Impact

- **Código afectado**:
  - `Dockerfile` (eliminar creación de `public/uploads`).
  - `docker-compose.yml` (sacar servicio `db`, dejar solo para dev).
  - `next.config.ts` (`images.remotePatterns` con dominio R2).
  - Nuevos archivos: `lib/storage/r2-client.ts`, `lib/storage/index.ts`, `.github/workflows/docker-publish.yml`, `docs/deployment.md`, `.dockerignore` (nuevo o revisado).
  - Cualquier lectura/escritura actual sobre `public/uploads` (a auditar en specs).
- **Dependencias nuevas**: `@aws-sdk/client-s3` (y opcionalmente `@aws-sdk/s3-request-presigner` si se necesitan URLs firmadas).
- **Variables de entorno**:
  - **Nuevas en runtime**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.
  - **Existentes que pasan a configurarse en Dokploy**: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (+ URLs de Clerk si aplica), `DRAFT_COOKIE_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_BOOTSTRAP_EMAILS`, `USPS_API_BASE`, `USPS_CONSUMER_KEY`, `USPS_CONSUMER_SECRET`.
  - **GitHub Secrets**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DOKPLOY_DEPLOY_WEBHOOK`.
- **Sistemas externos involucrados**: Docker Hub (registry), Cloudflare R2 (storage), Dokploy (orquestador), GitHub Actions (CI/CD).
- **Fuera de alcance**: tests/lint en el pipeline (se aborda en un change futuro); migración a S3 firmado o CDN frente a R2; observabilidad/monitoring.
