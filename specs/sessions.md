# Sessions log — Mahalo Enterprise

Bitácora cronológica de sesiones de implementación. Cada entrada se anexa al cierre de una sesión por la skill `/implement` (ver `.claude/skills/implement/SKILL.md`).

Formato de entrada:

```markdown
## YYYY-MM-DD · TXX — <título de la tarea>

- **Estado final**: ✅ completada | ⚠️ parcial | ❌ bloqueada
- **Archivos tocados**:
  - `path/al/archivo.ts` — qué cambió en una línea
- **Decisiones clave**:
  - Decisión y por qué.
- **Gotchas / aprendizajes**:
  - Sorpresas que ahorran tiempo a futuras sesiones.
- **Pendiente para próxima sesión** (si aplica):
  - …
- **Verificación realizada**:
  - Comando/acción y resultado.
```

Reglas:
- Solo información **no derivable** del código o git.
- Concisa. Si no hay nada destacable, una sola línea basta.
- Mantener orden cronológico (más reciente abajo).

---

<!-- Las entradas se agregan debajo a partir de la primera sesión de implementación. -->

## 2026-04-27 · T04 — Docker Compose + variables de entorno

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `next.config.ts` — agregado `output: 'standalone'`.
  - `Dockerfile` — multi-stage (deps → builder → runner) sobre `node:22-alpine`, usuario no-root `nextjs:1001`, copia `.next/standalone` y `.next/static`, prepara `public/uploads` con permisos.
  - `docker-compose.yml` — servicios `app` (build local) y `db` (`postgres:16-alpine`), volúmenes `pg_data` y `uploads`, healthcheck con `pg_isready`, `app` espera `service_healthy`.
  - `.dockerignore` — excluye node_modules, .next, .git, .env (preserva `.env.example`), specs, docs, .claude.
  - `.env.example` — todas las vars de `plan.md` §9 + `POSTGRES_*` para el servicio db.
  - `README.md` — reescrito con arranque Docker / Node y tabla de scripts (reemplaza scaffold de CNA).
- **Decisiones clave**:
  - `DATABASE_URL` se sobreescribe dentro de `docker-compose.yml` para apuntar a `db:5432` (host del servicio Compose). En `.env.example` apunta a `localhost` para la modalidad Node directo.
  - Volumen `uploads` montado en `/app/public/uploads` para persistir logos de proveedores entre rebuilds (T08).
  - Imagen base `node:22-alpine` (LTS más reciente que cumple con el `engines` implícito de Next 16).
  - No agregamos `npm run db:migrate` al CMD del contenedor todavía — eso entra en T05 cuando exista el script.
- **Gotchas / aprendizajes**:
  - `docker compose config` resuelve `env_file` automáticamente, así que las claves reales del `.env` (Clerk/Resend) viajan al contenedor sin duplicarlas en `environment:`.
  - El archivo `.env` ya existe con secretos del cliente (Resend, Clerk test keys) — `.gitignore` cubre `.env*` excepto que `.dockerignore` excluye explícitamente `.env` también para evitar que se cuele en la imagen.
  - `next.config.ts` con `output: 'standalone'` produce `.next/standalone/server.js` listo para `node server.js`. Verificado: `ls .next/standalone/` muestra `server.js`, `node_modules`, `package.json`.
- **Pendiente para próxima sesión**:
  - T05 (schema DB + primera migración) — la tarea siguiente; ya hay `db` healthy en compose.
- **Verificación realizada**:
  - `npm run build` (host) → ✓ standalone artifacts en `.next/standalone/`.
  - `docker compose config` → válido.
  - `docker compose up -d --build` → imagen `mahalo-website-app` construida, `db` healthy, `app` Up.
  - `curl http://localhost:3000` → **HTTP 200**. Criterio de aceptación cumplido.
  - `docker compose down` para liberar puertos al cierre.

## 2026-04-27 · T03 — Configurar Tailwind v4 + tema Mahalo

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `app/globals.css` — reescrito con tokens Mahalo (hex), `@theme inline` con utilidades `bg-mahalo-*`, gradient vars y utilities `.bg-mahalo-gradient`, `.text-mahalo-gradient`, `.eyebrow`. Dark mode eliminado.
  - `app/layout.tsx` — Inter (next/font/google, weights 400/500/600/700) reemplaza Geist. Metadata actualizada.
  - `components/ui/button.tsx` — agregadas variantes `primary` (gradiente) y `solid` (navy-900).
  - `components/ui/{accordion,badge,calendar,card,dialog,dropdown-menu,input,label,select,sheet,sonner,table,tabs}.tsx` — instalados vía `npx shadcn add`.
  - `components/ui/form.tsx` — escrito a mano (ver gotcha).
  - `components/brand/Logo.tsx` — wrapper con prop `variant: 'default' | 'white'`.
  - `components/brand/StatusBadge.tsx` — pill con los 6 colores de estado del PDF.
  - `app/style-guide/page.tsx` — visible solo en dev (`notFound()` en producción); muestra paleta, tipografía, botones, badges y form sample.
- **Decisiones clave**:
  - Tokens declarados en hex, no oklch — coincide literal con `design-system.md` §14 y simplifica verificación de contraste.
  - Variantes `primary`/`solid` agregadas al CVA del botón existente (no se reemplazó `default`) para no romper componentes shadcn que ya importan `default`.
  - Dark mode eliminado (light only, según design-system.md).
  - Variante `Logo white` se implementa con `brightness-0 invert` sobre el PNG hasta que el cliente entregue SVG monocromo (anotado en `tasks.md` pendientes del cliente).
- **Gotchas / aprendizajes**:
  - El registry `base-nova` de shadcn (definido en `components.json`) **no incluye** un componente `form` — `npx shadcn add form` retorna sin crear archivos. Solución: escrito a mano en `components/ui/form.tsx` siguiendo el patrón shadcn estándar (FormProvider + Controller). Incluye un mini-Slot inline para evitar agregar `@radix-ui/react-slot` (este registry usa `@base-ui/react`).
  - Componentes shadcn de `base-nova` usan `@base-ui/react` (no Radix). Cualquier ejemplo copiado de docs shadcn estándar puede requerir ajuste de imports.
  - shadcn CLI silenciosamente no instala items que no existen en el registry (no hay error). Verificar `ls components/ui/` después de cada add.
  - La página `app/page.tsx` aún es la scaffolding de CNA; se reemplazará en T16/T17. Las clases `dark:*` que tiene son inertes (no las redefinimos).
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (3.0s), 5 rutas estáticas incluyendo `/style-guide`.
  - Tokens Tailwind disponibles: `bg-mahalo-navy-900`, `text-mahalo-blue-600`, `bg-mahalo-cyan-500`, etc., compilan sin warnings.
  - Botón `primary` renderiza con gradient utility `.bg-mahalo-gradient`.
  - Los 6 status badges (Pending/Created/Scheduled/Installed/Completed/Cancelled) tienen su color correspondiente en `/style-guide`.
- **Pendiente para próxima sesión**:
  - T04 (Docker Compose + envs) — independiente del front.
  - Cliente: SVG vectorial y monocromo del logo para reemplazar el `brightness-0 invert` actual.

## 2026-04-27 · T02 — Instalar dependencias base

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `package.json` / `package-lock.json` — agregadas drizzle-orm, pg, resend, zod, react-hook-form, @hookform/resolvers (deps); drizzle-kit, @types/pg (devDeps).
  - `specs/tasks.md` — T02 marcada `[x]`.
- **Decisiones clave**:
  - shadcn ya estaba inicializado por CNA (components.json, lib/utils.ts, components/ui/button.tsx existían) → se omitió `npx shadcn init`. La instalación masiva de componentes shadcn se difiere a T03 según indica esa tarea.
  - `@clerk/nextjs@7.2.7` ya estaba presente; no se reinstaló.
- **Gotchas / aprendizajes**:
  - `npm audit` reporta 10 vulnerabilidades moderate post-install (heredadas de drizzle-kit / pg). No bloqueante; revisar antes de deploy en T39.
  - Stack ya tiene `@base-ui/react` (de CNA) además de shadcn. shadcn New York usa Radix; convivir con base-ui no debería dar conflictos pero estar atentos.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully en 10.6s, TypeScript ok, 4 static pages generadas. Criterio de aceptación cumplido.
- **Pendiente para próxima sesión** (T03):
  - Instalar componentes shadcn listados en T03 (button, input, card, dialog, form, select, table, toast, tabs, sheet, dropdown-menu, badge, accordion, calendar). `button` ya existe.

## 2026-04-27 · T01 — Leer documentación de Next.js 16

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `specs/notes-next16.md` — nuevo, resumen de breaking changes v16 relevantes al proyecto.
  - `specs/tasks.md` — T01 marcada `[x]`.
- **Decisiones clave**:
  - Mantener `middleware.ts` (no migrar a `proxy.ts`) hasta que Clerk publique guía oficial — `proxy` solo soporta runtime nodejs y la doc de Clerk asume el nombre `middleware`.
  - No habilitar React Compiler todavía: aumenta tiempos de build y aún no hay evidencia de rerenders problemáticos.
  - Convención del proyecto: `updateTag` para mutaciones admin (read-your-writes), `revalidateTag(tag, 'max')` para listados públicos, `refresh()` para router-only.
- **Gotchas / aprendizajes**:
  - v16 versión instalada: **16.2.4**.
  - `cookies()`, `headers()`, `params`, `searchParams` ahora son **siempre** Promise. La compat sincrónica de v15 fue eliminada — afecta T13, T14, T15, T08, T09, T23.
  - `revalidateTag` ahora **requiere segundo argumento** (`cacheLife` profile). Llamadas viejas dan error TS.
  - `next/image`: `images.domains` deprecado (usar `remotePatterns`); default `qualities` es `[75]` (otros valores se snapean).
  - `next lint` removido — `next build` ya no corre lint. Si queremos CI lint, llamar ESLint/Biome directo.
  - Turbopack es default en `dev` y `build`; el flag `--turbopack` en scripts de package.json estorba.
  - `next dev` escribe en `.next/dev` y `next build` en `.next` (separados, ejecución concurrente posible).
- **Verificación realizada**:
  - Lectura de `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` completa.
  - Cross-check con `01-getting-started/07-mutating-data.md` para confirmar API actual de server actions y nuevas funciones de caché.
  - Decisiones del `plan.md` confirmadas válidas; ajustes propagados quedan anotados en §Conclusión del notes.
- **Pendiente para próxima sesión**:
  - T02: al instalar deps, ejecutar `npx next typegen` para tipos `PageProps` / `LayoutProps` / `RouteContext`.
  - T02: limpiar `--turbopack` de los scripts de `package.json` si Create Next App lo dejó.
