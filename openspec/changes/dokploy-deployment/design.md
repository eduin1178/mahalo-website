## Context

Hoy el proyecto se ejecuta solamente en local con un `docker-compose.yml` que mezcla la app y Postgres, y los uploads se guardan en `./public/uploads`. No hay pipeline de build, no hay imagen publicada en un registry, no hay separación entre datos productivos y código, y no hay procedimiento documentado para migrar la base.

El objetivo es llegar a un despliegue en **Dokploy** que cumpla tres invariantes:
1. La base de datos productiva vive como **servicio de Dokploy**, en la misma red interna del proyecto que la app, pero **fuera del `docker-compose.yml` del repo**.
2. La imagen de la app la construye **GitHub Actions** y la publica a **Docker Hub**. Dokploy nunca compila; solo hace `docker pull` y redeploy.
3. Los archivos subidos por usuarios viven en **Cloudflare R2**, no en el contenedor.

Restricciones / stakeholders:
- Next.js 16 ya está configurado con `output: "standalone"` — el `Dockerfile` actual sirve.
- El único punto del código que hoy escribe en `public/uploads` es `lib/providers/actions.ts → uploadProviderLogo` (validado con grep).
- Las migraciones se ejecutan vía `npm run db:migrate` con `tsx`. El usuario aceptó hacerlas **manualmente** vía exposición temporal del puerto Postgres.
- El operador y desarrollador inicial es la misma persona (eduin1178@gmail.com); el procedimiento debe ser ejecutable por una sola persona sin equipo de plataforma.

## Goals / Non-Goals

**Goals:**
- Workflow de GitHub Actions reproducible, idempotente y rápido (cache de buildx).
- Imagen Docker mínima sin secretos y sin `node_modules` de dev.
- API de storage abstracta (`lib/storage`) que oculte el SDK de S3 al resto del código y permita cambiar de proveedor en el futuro con un solo cambio.
- Documento `docs/deployment.md` autoexplicativo que sirva como runbook completo.
- Procedimiento de migración manual con pasos atómicos y reversibles.

**Non-Goals:**
- Migraciones automáticas en el pipeline (descartado por decisión del usuario).
- CDN frente a R2, URLs firmadas o ACLs por archivo (el bucket se sirve público vía R2 public domain).
- Tests / lint en el workflow de Docker (se difiere a otro change).
- Multi-entorno (`staging` ≠ `production`): por ahora hay un solo entorno productivo. La estructura por branches (`master` → latest, `dev` → dev tag) deja la puerta abierta sin implementarlo todavía.
- Observabilidad, healthchecks avanzados, autoscaling.
- Rotación automática de credenciales.

## Decisions

### D1. Imagen Docker en Docker Hub público vs registry privado
**Decisión**: Docker Hub público.

**Por qué**: simplifica al máximo el deploy en Dokploy (no requiere configurar credenciales de pull). El código fuente ya vive en un repo privado de GitHub; lo que se publica en Docker Hub es el bundle compilado de Next.js, sin secretos (gracias al `.dockerignore`). El riesgo de "que cualquiera vea la imagen" es bajo: no contiene credenciales, solo el código compilado, que es equivalente a tener el sitio público.

**Alternativa considerada**: GitHub Container Registry (`ghcr.io`) con visibilidad privada. Requiere setear `imagePullSecrets` en Dokploy. Más overhead operativo. Se puede migrar después cambiando el `tags:` del workflow y agregando credenciales en Dokploy, sin tocar la app.

### D2. Estrategia de tags
**Decisión**:
- `master` push → `:latest` + `:sha-<short>`.
- `dev` push → `:dev` + `:sha-<short>`.
- Dokploy app configurada a `:latest` (productivo).
- Rollback = en Dokploy cambiar la imagen a un `:sha-<short>` anterior y redeploy.

**Por qué**: `:latest` es cómodo para el camino feliz; los `:sha-*` inmutables habilitan rollback determinista. Mantener `:dev` deja una vía para futuro entorno de staging sin cambiar el workflow.

### D3. Auto-deploy via webhook de Dokploy (no GitOps)
**Decisión**: el workflow llama al webhook de Dokploy con un `curl -X POST` al final. Dokploy hace `docker pull` y redeploy.

**Por qué**: es el contrato nativo de Dokploy y evita instalar agentes/GitHub apps. Si el webhook no está configurado (secret faltante), el step se skipea con warning — el operador puede gatillar manualmente desde Dokploy. Esto cubre el caso de bootstrap inicial donde el webhook todavía no existe.

**Alternativa**: SSH desde Actions al server. Más frágil (manejo de llaves), más superficie de ataque.

### D4. Storage: R2 público vía bucket public URL, SDK de AWS S3
**Decisión**: usar `@aws-sdk/client-s3` apuntando al endpoint S3-compatible de R2 (`https://<account_id>.r2.cloudflarestorage.com`). Servir los archivos por la URL pública de R2 (subdominio `pub-<hash>.r2.dev` o un custom domain ligado al bucket).

**Por qué**: R2 es S3-compatible, el SDK de AWS está battle-tested, y mantener una API S3 facilita cambiar a S3/MinIO/Backblaze en el futuro tocando solo `lib/storage/r2-client.ts`. Servir público vía R2 evita firmar URLs en cada render y simplifica `next/image`.

**Alternativa considerada**: SDK propietario de Cloudflare Workers / `@cloudflare/...`. Lock-in mayor, menos portátil.

**Trade-off**: cualquiera con la URL puede ver el archivo. Como los logos son públicos por definición y los uploads actuales son solo logos de provider, es aceptable. Si en el futuro hay uploads sensibles, se introduce una segunda variante en el módulo (`putObject` con `acl: "private"` + URLs firmadas) sin romper la API existente.

### D5. Forma de la API de storage
**Decisión**:
```ts
// lib/storage/index.ts
export async function putObject(input: { key: string; body: Buffer | Uint8Array | Blob; contentType: string }): Promise<{ key: string }>;
export function getPublicUrl(key: string): string;
export async function deleteObject(key: string): Promise<void>; // idempotente: ignora 404
```
El cliente S3 se construye una sola vez (singleton) lazily, validando variables al primer uso.

**Por qué**: superficie mínima, suficiente para los casos actuales y futuros más comunes. La función `getPublicUrl` se mantiene sincrónica porque solo concatena base + key — el llamador no necesita esperar a R2.

### D6. Estructura de keys en el bucket
**Decisión**: prefijos por dominio: `providers/<provider-id>.<ext>`, futuros: `orders/<order-id>/...`, `users/<user-id>/...`.

**Por qué**: ordena el bucket, permite políticas/lifecycle por prefijo si en el futuro se necesitan, y mantiene compatibilidad mental con la estructura previa de `public/uploads/providers/`.

### D7. `docker-compose.yml`: dev-only, no renombrar
**Decisión**: dejar `docker-compose.yml` con solo el servicio `db` de Postgres para desarrollo local (lo que ya tiene), y documentar al inicio del archivo y en `docs/deployment.md` que **NO se usa en producción**.

**Por qué**: renombrarlo a `docker-compose.dev.yml` rompe el reflejo `docker compose up` para devs y no aporta seguridad real (Dokploy nunca lee ese archivo de todos modos). Un comentario claro arriba alcanza.

### D8. Migraciones manuales con puerto temporal
**Decisión**: el operador habilita el puerto público en el servicio Postgres de Dokploy, construye una URL `postgres://user:pwd@<dokploy-host>:<port>/db`, exporta `DATABASE_URL` y corre `npm run db:migrate` desde su máquina, y luego cierra el puerto.

**Por qué**: el usuario lo aceptó explícitamente. Es simple, no requiere infra extra (no jump host, no túnel SSH), y la ventana de exposición la controla el operador. El riesgo lo mitigamos con (a) password fuerte generado al provisionar Postgres, (b) checklist explícito que termina con "verificar que el puerto vuelve a estar cerrado".

**Alternativa**: túnel SSH vía el server de Dokploy. Más seguro, más complejo. Se puede adoptar después sin cambiar el código.

### D9. Compilación del paso de migración
**Decisión**: NO compilamos `lib/db/migrate.ts` para producción porque las migraciones no se corren en la imagen. Se siguen ejecutando con `tsx` desde local contra el puerto expuesto.

**Por qué**: cero cambio en el flujo de migración existente, cero peso extra en la imagen.

### D10. `.dockerignore` exhaustivo
**Decisión**: crear o reescribir `.dockerignore` para excluir:
```
.git
.github
node_modules
.next
.env
.env.*
docs
openspec
*.md
docker-compose.yml
.vscode
.idea
```
Justificado: ni `docs` ni `openspec` ni el compose deben viajar en la imagen.

## Risks / Trade-offs

- **[Secretos en logs de Actions]** → Mitigación: usar siempre `${{ secrets.* }}` (que GitHub redacta automáticamente). Nunca `echo` de variables sensibles. El step de webhook usa `curl -fsS -X POST "${{ secrets.DOKPLOY_DEPLOY_WEBHOOK }}"`.
- **[Ventana de exposición de Postgres durante migración]** → Mitigación: password fuerte; checklist que obliga a cerrar el puerto al finalizar; recomendación de restringir por IP en Dokploy si la plataforma lo permite.
- **[Image bloat]** → Mitigación: multi-stage build ya existente + `.dockerignore` exhaustivo. Verificar tamaño tras el primer build.
- **[R2 public URL leak]** → Asumido: los logos son contenido público. Se documenta que esta capa NO debe usarse para archivos sensibles sin revisión adicional.
- **[Rollback]** → Mitigación: tags `sha-*` inmutables permiten apuntar a una imagen previa en Dokploy. Documentar en el runbook.
- **[Webhook silencioso]** → Mitigación: el step de webhook usa `curl -fsS` (falla en HTTP no-2xx) y se ejecuta como step separado para que el log sea visible.

## Migration Plan

Esta sección describe el orden de adopción del cambio, asumiendo que el repo ya está en `dev` con esta propuesta y el operador va a desplegar por primera vez.

1. **Cloudflare R2**: crear cuenta/bucket, generar token API S3, anotar valores.
2. **Docker Hub**: crear repo y access token.
3. **Implementar código** (ver `tasks.md`).
4. **Configurar GitHub Secrets**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. (El secret de Dokploy se agrega después, en el paso 7).
5. **Hacer merge a `master`** → primer build, primera imagen en Docker Hub.
6. **Crear proyecto en Dokploy**: servicio Postgres (sin puerto público) + servicio App (`tu-usuario/mahalo-website:latest`).
7. **Configurar env vars en Dokploy app** + obtener URL del webhook → guardarla como GitHub Secret `DOKPLOY_DEPLOY_WEBHOOK`.
8. **Ejecutar migración inicial**: seguir runbook → exponer puerto, correr `npm run db:migrate`, cerrar puerto.
9. **Trigger primer deploy** en Dokploy (manual). Verificar que la app levanta y conecta a Postgres + R2.
10. A partir de acá: cada push a `master` dispara build → push → webhook → redeploy automático.

**Rollback** (en caso de deploy roto):
- En el panel de Dokploy de la app, cambiar la imagen a `tu-usuario/mahalo-website:sha-<commit-previo>` y redeploy.
- Si la causa es una migración mala: rollback de imagen + re-exponer puerto + correr migración inversa manualmente.

## Open Questions

- **Nombre del repo en Docker Hub**: se asume `<dockerhub-user>/mahalo-website`. Confirmar en `tasks.md` antes de cablearlo en el workflow.
- **Custom domain en R2**: ¿usamos el subdominio `pub-*.r2.dev` por defecto o atamos un subdominio propio (por ejemplo `cdn.tudominio.com`) al bucket? Decisión deferida — el código no cambia, solo el valor de `R2_PUBLIC_BASE_URL`.
- **Branch de deploy para staging**: hoy el workflow trata `dev` con tag `:dev` pero no se conecta a ningún Dokploy de staging. Pendiente para cuando exista staging.
