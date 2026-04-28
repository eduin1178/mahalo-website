# Mahalo Enterprise — Plan técnico

Plan general de implementación. Para tareas paso a paso ver `tasks.md`. Para requerimientos funcionales ver `spec.md`. Para tokens visuales (paleta, tipografía, gradiente de marca) ver `design-system.md`.

## 1. Arquitectura
Next.js 16 con App Router en una sola aplicación con dos áreas:
- **Pública** — `app/(public)/` para landing y embudo.
- **Admin** — `app/admin/` protegida por middleware de Clerk.

Mutaciones vía **server actions**. Route handlers (`app/api/`) solo para webhooks entrantes si hicieran falta. Las llamadas salientes a n8n y Resend se hacen server-side desde server actions.

> Esta versión de Next.js tiene cambios incompatibles. Antes de codificar cualquier feature, leer la guía relevante en `node_modules/next/dist/docs/`.

## 2. Capas
- **UI** — shadcn/ui sobre Tailwind CSS v4.
- **Dominio** — funciones puras y server actions en `lib/` (providers, plans, orders, coverage, notifications, settings).
- **Datos** — Drizzle ORM sobre PostgreSQL (compatible con RSC y server actions de Next 16).

## 3. Estructura de carpetas
```
app/
  (public)/
    page.tsx                # landing
    checkout/[[...step]]/   # embudo paso a paso
    legal/{terms,privacy}/
  admin/
    layout.tsx              # sidebar + guard
    providers/
    plans/
    add-ons/
    coverage/
    orders/
    customers/
    settings/
  api/                      # solo si hace falta route handler
components/
  ui/                       # shadcn
  landing/
  checkout/
  admin/
lib/
  db/{client.ts,schema.ts}
  providers/
  plans/
  orders/
  coverage/
  customers/
  usps/
  resend/
  webhook/
  clerk/
  settings/
db/migrations/
public/uploads/             # logos de proveedores
specs/
```

## 4. Modelo de datos
Las 8 entidades del PDF (`spec.md` §8) implementadas en `lib/db/schema.ts` con Drizzle. Convenciones:
- `id` → `uuid` con `gen_random_uuid()`.
- `created_at` / `updated_at` → `timestamptz` con default `now()`.
- JSONs (`features`, `installation_address`, `billing_address`, `payment_data`, `add_on_ids`) → columna `jsonb`.
- Índices: `provider_coverage(zip_code)`, `orders(status)`, `orders(customer_id)`.

## 5. Estado del embudo
Se persiste como una fila en `orders` con status `Draft` desde el paso 1. Cada paso es una server action que:
1. Valida con Zod.
2. Hace `update` parcial sobre el draft.
3. Redirige al siguiente paso vía `redirect()`.

El paso 8 cambia el status a `Pending` y dispara notificaciones. El `orderId` viaja en searchParams o cookie firmada.

## 6. Auth y roles
- En Next.js 16 el middleware se llama **`proxy.ts`** (renombrado desde `middleware.ts`). Está en la raíz, usa `clerkMiddleware` y protege `/admin/*` excepto `/admin/sign-in`.
- Rol del usuario en `publicMetadata.role` (`admin` | `agent`).
- Helper `requireRole(role)` en `lib/clerk/` para guards en server components y actions.
- **Panel privado por allowlist**: Clerk permite el sign-up por defecto, pero el layout `app/admin/(panel)/layout.tsx` bloquea a usuarios sin rol asignado mostrando "Pending authorization" (no menús, no acceso a páginas internas).
- **Bootstrap del primer admin**: env `ADMIN_BOOTSTRAP_EMAILS` (CSV de emails). En el primer hit al panel, si el email coincide y el rol está vacío, se auto-promueve a `admin` vía `clerkClient.users.updateUser`. Pensado solo para semilla — después se gestiona desde Clerk dashboard o con el CLI.
- **CLI de roles**: `npm run set-role -- <email> <admin|agent>` (script en `scripts/set-role.ts`) usa `@clerk/backend` para mutar `publicMetadata.role` sin abrir el dashboard.

## 7. Integraciones externas
| Wrapper | Ubicación | Responsabilidad |
|---|---|---|
| USPS | `lib/usps/` | Validación de ZIP y resolución de dirección. |
| Resend | `lib/resend/` | Email de "new order" al `notification_email`. |
| Webhook n8n | `lib/webhook/` | POST con payload JSON; reintento simple (1 retry). |
| Clerk | `lib/clerk/` | Helpers de auth y rol. |

Configuración: ver §9 de envs. Resend domain y USPS credentials son inputs del cliente.

## 8. Pagos
Se almacenan en `orders.payment_data` (jsonb) en plain text según requerimiento explícito del PDF. PCI es responsabilidad del cliente. Recomendación pendiente: cifrar columna con `pgcrypto` o KMS — anotar en pendientes.

## 9. Variables de entorno
```
DATABASE_URL
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/admin/sign-in
ADMIN_BOOTSTRAP_EMAILS  # CSV de emails que se auto-promueven a admin en su primer login
RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@mahaloenterprise.com
USPS_USER_ID            # o el credential que aplique según API USPS vigente
USPS_API_BASE
NEXT_PUBLIC_APP_URL
```
Defaults en `.env.example`. Nada sensible commiteado.

## 10. Infraestructura
- `docker-compose.yml` con servicios `app` (Next standalone) y `db` (Postgres 16). Volumen para `public/uploads`.
- Build de Next con `output: 'standalone'`.
- Deploy en Dokploy sobre VPS. Migraciones se ejecutan en el `start` del contenedor.

## 11. Convenciones de código
- TypeScript estricto.
- Validación de inputs en cada server action con Zod.
- Componentes server por defecto; `"use client"` solo donde se necesite estado/eventos.
- shadcn/ui como única librería de componentes; nada custom hasta agotar shadcn.
- Sin librerías de form globales más allá de `react-hook-form` + `@hookform/resolvers/zod` en formularios complejos.

## 12. Roadmap por fases
0. **Setup** — proyecto, dependencias, DB, Docker.
1. **Admin foundations** — auth, CRUDs base, settings.
2. **Landing pública** — secciones informativas, hero, USPS.
3. **Embudo de compra** — 8 pasos completos.
4. **Notificaciones** — email + webhook.
5. **Hardening & deploy** — a11y, performance, seed, deploy.

Ver `tasks.md` para el detalle de cada fase y las tareas individuales (T01–T40), con descripción, archivos involucrados, criterios de aceptación y dependencias.

## 13. Pendientes del cliente (bloquean ciertas tareas)
Versiones SVG y monocroma del logo · contenido FAQ/testimonials/legales · credenciales USPS · setup Clerk · API key Resend + dominio verificado · decisión sobre cifrado de pagos · CSV bulk import de ZIPs (sprint futuro).

> Logo y paleta corporativa: **resueltos**. Logo en `public/logo.png`. Paleta y guías visuales en `design-system.md`.
