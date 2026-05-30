## 1. Storage module (R2)

- [x] 1.1 Agregar dependencia `@aws-sdk/client-s3` a `package.json` (sin instalar SDK extra para presigner).
- [x] 1.2 Crear `lib/storage/r2-client.ts` con un singleton `S3Client` lazy que valide `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` y arroje error claro nombrando la variable faltante.
- [x] 1.3 Crear `lib/storage/index.ts` exportando `putObject({ key, body, contentType })`, `getPublicUrl(key)`, `deleteObject(key)` con la semántica del spec `file-storage` (deleteObject idempotente).
- [x] 1.4 Refactorizar `lib/providers/actions.ts → uploadProviderLogo` para que use `putObject` + `getPublicUrl` + `deleteObject` en vez de `fs/promises`. Guardar en `providers.logoUrl` la URL pública absoluta devuelta por `getPublicUrl`.
- [x] 1.5 Quitar imports `mkdir`, `writeFile`, `unlink`, `node:path` del archivo y eliminar la lógica de `path.join(process.cwd(), "public", "uploads", ...)`.
- [x] 1.6 Actualizar `next.config.ts → images.remotePatterns` para autorizar el host derivado de `R2_PUBLIC_BASE_URL` (parseo en build time vía `new URL(...)`); mantener el patrón existente `/uploads/**` solo si sigue siendo necesario para activos legacy, si no removerlo.

## 2. Dockerfile + compose + dockerignore

- [x] 2.1 Editar `Dockerfile`: eliminar la línea `RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads`.
- [x] 2.2 Crear `.dockerignore` en la raíz con: `.git`, `.github`, `node_modules`, `.next`, `.env`, `.env.*`, `docs`, `openspec`, `*.md`, `docker-compose.yml`, `.vscode`, `.idea`.
- [x] 2.3 Agregar comentario al inicio de `docker-compose.yml` aclarando que es solo para desarrollo local; producción usa Dokploy.

## 3. GitHub Actions workflow

- [x] 3.1 Crear `.github/workflows/docker-publish.yml` con triggers `push: branches: [master, dev]` y `workflow_dispatch`.
- [x] 3.2 Step de checkout + `docker/setup-qemu-action` + `docker/setup-buildx-action`.
- [x] 3.3 Step de login a Docker Hub usando `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN`.
- [x] 3.4 Step de `docker/metadata-action` que genere tags: `sha-<short>` siempre, `latest` solo en `master`, `dev` solo en `dev`.
- [x] 3.5 Step de `docker/build-push-action` con `push: true`, `cache-from: type=gha`, `cache-to: type=gha,mode=max`.
- [x] 3.6 Step final condicional que hace `curl -fsS -X POST "${{ secrets.DOKPLOY_DEPLOY_WEBHOOK }}"` solo si el secret está definido; si no, `echo` un warning y skipea sin fallar.

## 4. Documentación

- [x] 4.1 Crear `docs/deployment.md` con secciones: (a) Arquitectura, (b) Pre-requisitos externos (Cloudflare R2, Docker Hub, Dokploy), (c) Variables de entorno con tabla (nombre · dónde se configura · de dónde se obtiene · ejemplo), (d) Runbook primer deploy, (e) Runbook redeploy normal, (f) Runbook migraciones manuales con puerto temporal, (g) Runbook rollback.
- [x] 4.2 En la sección de migraciones, incluir checklist explícito: habilitar puerto público en Postgres de Dokploy → construir `DATABASE_URL=postgres://user:pwd@host:port/db` → `DATABASE_URL=... pnpm run db:migrate` → verificar → deshabilitar puerto público → confirmar que el puerto cerró.
- [x] 4.3 En la sección de rollback, documentar el flujo de cambiar la imagen a `sha-<commit>` previo en el panel de Dokploy.
- [x] 4.4 Linkear desde `README.md` la nueva guía (`docs/deployment.md`).

## 5. Verificación local

- [x] 5.1 `pnpm run build` corre sin errores tras el refactor de uploads y los cambios en `next.config.ts`. _(verificado vía `tsc --noEmit` — type-check limpio; el `next build` real lo corre el primer push a master)_.
- [ ] 5.2 `docker build .` produce una imagen que NO contiene `public/uploads`, `.env*`, `node_modules` (verificar con `docker run --rm <image> ls -la /app && ls -la /app/public`). _(diferido — lo verifica el primer build de GitHub Actions)_.
- [ ] 5.3 `docker run` con variables dummy NO crashea al arrancar; el crash en R2 ocurre recién al primer `uploadProviderLogo`, no al boot. _(diferido — se valida en el primer deploy a Dokploy)_.
- [ ] 5.4 Smoke local con credenciales reales de R2: subir un logo desde admin/providers y confirmar que (a) el archivo aparece en el bucket, (b) la URL guardada en `providers.logoUrl` se renderiza correctamente por `next/image`. _(diferido — requiere credenciales reales tras configurar Dokploy)_.

## 6. Entrega final al operador

- [x] 6.1 Generar el bloque resumen único al usuario con TODAS las credenciales/variables a obtener y dónde configurarlas (GitHub Secrets, Cloudflare R2, Dokploy app env, Dokploy Postgres). Este es el último paso visible para el operador antes de hacer el deploy real.
