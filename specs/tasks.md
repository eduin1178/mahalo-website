# Mahalo Enterprise — Tareas

Cada tarea está pensada para ejecutarse en una sesión independiente. Cualquier dev (o Claude) debe poder leer **una sola tarea** y completarla sin contexto adicional fuera de `spec.md` y `plan.md`.

Convenciones:
- **Estado**: `[ ]` pendiente · `[~]` en progreso · `[x]` completada.
- **Depende de**: tareas que deben estar en `[x]` antes de empezar esta.
- **Bloqueada por cliente**: input externo necesario; se puede preparar el código con placeholders.
- Antes de codificar cualquier feature: leer la guía relevante en `node_modules/next/dist/docs/`.

---

## Fase 0 — Setup

### T01 · Leer documentación de Next.js 16
- **Estado**: [x]
- **Objetivo**: Identificar cambios incompatibles que afecten el resto de las tareas.
- **Acciones**:
  1. Listar `node_modules/next/dist/docs/` y leer guías de: App Router, Server Actions, Middleware, `output: 'standalone'`, caching, `searchParams` async API.
  2. Anotar en `specs/notes-next16.md` los cambios relevantes (APIs deprecadas, breaking changes, nuevas convenciones).
- **Deliverables**: `specs/notes-next16.md`.
- **Criterio de aceptación**: las decisiones de `plan.md` siguen siendo válidas o se actualizan en consecuencia.
- **Depende de**: —

### T02 · Instalar dependencias base
- **Estado**: [x]
- **Objetivo**: Dejar `package.json` con todas las libs del stack listas.
- **Acciones**:
  1. `npm i drizzle-orm pg @clerk/nextjs resend zod react-hook-form @hookform/resolvers`.
  2. `npm i -D drizzle-kit @types/pg`.
  3. `npx shadcn@latest init` (estilo: New York, baseColor: neutral, CSS variables).
  4. Commit `package.json` + `package-lock.json` + archivos de shadcn.
- **Deliverables**: deps instaladas, `components.json` de shadcn, `lib/utils.ts`.
- **Criterio de aceptación**: `npm run build` pasa sin errores.
- **Depende de**: T01

### T03 · Configurar Tailwind v4 + tema Mahalo
- **Estado**: [x]
- **Objetivo**: Implementar el design system de marca en código.
- **Referencia**: `specs/design-system.md` (fuente de verdad de paleta, gradiente, tipografía, radii, sombras).
- **Acciones**:
  1. En `app/globals.css` declarar el bloque `@theme inline` y los tokens `:root` exactamente como aparecen en `design-system.md` §14.
  2. Cargar `Inter` con `next/font/google` (weights 400/500/600/700) y aplicarla en `app/layout.tsx`.
  3. Configurar `--mahalo-gradient` como CSS variable y crear utility `.bg-mahalo-gradient`.
  4. Light mode únicamente (no dark mode).
  5. Instalar componentes shadcn iniciales: `button`, `input`, `card`, `dialog`, `form`, `select`, `table`, `toast`, `tabs`, `sheet`, `dropdown-menu`, `badge`, `accordion`, `calendar`.
  6. Override de variantes shadcn para alinear con `design-system.md` §10 (ej. variante `primary` usa el gradiente; `solid` usa navy-900).
  7. Crear `components/brand/Logo.tsx` que renderiza `public/logo.png` con `next/image`, con prop `variant?: 'default' | 'white'` (white usa fallback hasta que cliente entregue SVG monocromo).
  8. Página de prueba `/style-guide` (solo en dev) que muestra paleta, tipografía, botones y badges de estado para verificación visual.
- **Deliverables**: `app/globals.css`, fuentes cargadas, componentes shadcn personalizados, `Logo` component, `/style-guide`.
- **Criterio de aceptación**:
  - Tokens del design system disponibles como utilidades Tailwind (`bg-mahalo-navy-900`, `text-mahalo-blue-600`, etc.).
  - El botón `primary` muestra el gradiente navy→blue→cyan.
  - Los 6 estados de orden tienen su badge color correcto en `/style-guide`.
  - Contrastes verificados según `design-system.md` §15.
- **Depende de**: T02

### T04 · Docker Compose + variables de entorno
- **Estado**: [x]
- **Objetivo**: Levantar el stack local con un solo comando.
- **Acciones**:
  1. Crear `docker-compose.yml` con servicios `app` (build desde Dockerfile) y `db` (postgres:16) y volumen `pg_data`, `uploads`.
  2. Crear `Dockerfile` para Next standalone (multi-stage: deps → build → runner).
  3. Configurar `next.config.ts` con `output: 'standalone'`.
  4. Crear `.env.example` con todas las vars de `plan.md` §9.
  5. Documentar arranque en `README.md`.
- **Deliverables**: `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `.env.example`, README actualizado.
- **Criterio de aceptación**: `docker compose up --build` levanta app y db; `localhost:3000` responde.
- **Depende de**: T02

### T05 · Schema de DB + primera migración
- **Estado**: [x]
- **Objetivo**: Modelo de datos completo persistido.
- **Acciones**:
  1. Crear `lib/db/schema.ts` con las 8 tablas de `spec.md` §8 usando Drizzle.
  2. Crear `lib/db/client.ts` (singleton de `pg` + `drizzle()`).
  3. Configurar `drizzle.config.ts`.
  4. Ejecutar `drizzle-kit generate` y revisar la migración SQL.
  5. Script `npm run db:migrate` que aplique las migraciones al arrancar.
  6. Crear seed mínimo en `lib/db/seed.ts` con los 8 proveedores del PDF (sin planes ni cobertura todavía).
- **Deliverables**: `lib/db/schema.ts`, `db/migrations/0000_*.sql`, `lib/db/seed.ts`, scripts en `package.json`.
- **Criterio de aceptación**: tras `db:migrate` y `db:seed`, las 8 tablas existen y `providers` tiene 8 filas.
- **Depende de**: T04

---

## Fase 1 — Admin foundations

### T06 · Integrar Clerk y proteger /admin
- **Estado**: [x]
- **Objetivo**: Solo usuarios autenticados acceden a `/admin/*`.
- **Acciones**:
  1. Configurar `<ClerkProvider>` en `app/layout.tsx`.
  2. Crear `middleware.ts` con `clerkMiddleware()` y matcher para `/admin(.*)`.
  3. Crear `app/admin/sign-in/[[...sign-in]]/page.tsx` con `<SignIn />`.
  4. Crear `lib/clerk/require-role.ts` con helper `requireRole('admin' | 'agent')` que lee `auth().sessionClaims?.publicMetadata.role`.
  5. Página `/admin` con `<UserButton />` y bienvenida.
- **Deliverables**: middleware, helpers, página de login, página de bienvenida admin.
- **Criterio de aceptación**: visitar `/admin` sin sesión redirige a sign-in; con sesión muestra la bienvenida.
- **Depende de**: T05
- **Bloqueada por cliente**: Clerk app + claves (placeholder permite trabajar local).

### T07 · Layout admin con sidebar y guard de rol
- **Estado**: [x]
- **Objetivo**: Estructura común para todas las páginas admin.
- **Acciones**:
  1. `app/admin/layout.tsx` con sidebar (shadcn `Sheet` en mobile, fijo en desktop) con links: Providers, Plans, Add-ons, Coverage, Orders, Customers, Settings.
  2. Items de "gestión" (providers, plans, add-ons, coverage, settings) ocultos para rol `agent`.
  3. Header con `<UserButton />`.
  4. Componentes en `components/admin/`.
- **Deliverables**: layout + sidebar + header.
- **Criterio de aceptación**: usuario `agent` no ve enlaces de gestión; `admin` los ve todos.
- **Depende de**: T06

### T08 · CRUD Providers
- **Estado**: [x]
- **Objetivo**: Admin gestiona proveedores.
- **Acciones**:
  1. Server actions en `lib/providers/actions.ts`: `listProviders`, `createProvider`, `updateProvider`, `toggleProviderActive`.
  2. Validación con Zod (`name`, `primary_color` hex, `is_active`).
  3. Subida de logo: server action que guarda en `public/uploads/providers/{id}.{ext}`; valida tipo y tamaño (max 1MB, png/jpg/webp/svg).
  4. Página `/admin/providers` con tabla shadcn (nombre, logo, color, estado, acciones).
  5. Página `/admin/providers/[id]` con form de edición.
  6. Botón "New provider" abre dialog con form.
- **Deliverables**: actions, páginas, components/admin/providers/.
- **Criterio de aceptación**: crear, editar, desactivar y reactivar proveedores funciona end-to-end.
- **Depende de**: T07

### T09 · CRUD Plans (por proveedor)
- **Estado**: [x]
- **Objetivo**: Cada proveedor tiene planes gestionables.
- **Acciones**:
  1. Actions en `lib/plans/actions.ts`: `listPlansByProvider`, `createPlan`, `updatePlan`, `togglePlanActive`, `reorderPlans`.
  2. Schema Zod: `name`, `speed`, `price_standard`, `price_autopay`, `features` (array de strings), `sort_order`.
  3. UI: dentro de `/admin/providers/[id]` agregar tab "Plans" con tabla de planes.
  4. Reorder simple con inputs numéricos `sort_order` (drag-and-drop opcional, ver plan).
- **Deliverables**: actions, UI integrada en detalle del proveedor.
- **Criterio de aceptación**: planes creados aparecen ordenados por `sort_order` ascendente.
- **Depende de**: T08

### T10 · CRUD Add-ons (por proveedor)
- **Estado**: [x]
- **Objetivo**: Add-ons opcionales por proveedor.
- **Acciones**:
  1. Actions en `lib/add-ons/actions.ts`: list/create/update/toggle.
  2. Schema Zod: `name`, `description`, `price`, `is_active`.
  3. UI: tab "Add-ons" en detalle del proveedor.
- **Deliverables**: actions + UI.
- **Criterio de aceptación**: si un proveedor no tiene add-ons activos, una flag/bool helper `providerHasActiveAddOns(providerId)` retorna `false` (se usará en el embudo).
- **Depende de**: T08

### T11 · Coverage manager (ZIPs)
- **Estado**: [x]
- **Objetivo**: Asignar ZIP codes a cada proveedor.
- **Acciones**:
  1. Actions: `listCoverageByProvider`, `addZips(providerId, zips[])`, `removeZip(providerId, zip)`.
  2. UI en `/admin/coverage` con selector de proveedor y dos paneles: ZIPs asignados (tabla con search + paginación) y formulario para agregar (textarea con uno por línea o coma-separados, validar formato `^\d{5}$`).
  3. Función query `findProvidersByZip(zip)` en `lib/coverage/queries.ts` (la usará la landing).
  4. Stub de CSV import (botón deshabilitado con tooltip "Próximamente").
- **Deliverables**: actions, queries, UI.
- **Criterio de aceptación**: agregar 50 ZIPs y eliminarlos individualmente funciona; `findProvidersByZip` retorna proveedores activos correctos.
- **Depende de**: T08

### T12 · Settings (key-value)
- **Estado**: [x]
- **Objetivo**: Configurar `notification_email` y `webhook_url` desde el admin.
- **Acciones**:
  1. Actions: `getSetting(key)`, `setSetting(key, value)`, `getAllSettings()`.
  2. Página `/admin/settings` con form para los dos keys conocidos + sección "Custom" para agregar pares libres (preparado para extensibilidad).
  3. Helper `lib/settings/get.ts` con cache por request.
- **Deliverables**: actions, helper, UI.
- **Criterio de aceptación**: cambiar el valor desde UI persiste y se lee desde server actions de notificaciones.
- **Depende de**: T07

### T13 · Listado de Orders
- **Estado**: [x]
- **Objetivo**: Agentes ven todas las órdenes.
- **Acciones**:
  1. Página `/admin/orders` con tabla: id corto, customer, provider, plan, status (badge con color del PDF), scheduled_at, created_at.
  2. Filtros: status (multi-select), provider, rango de fechas, search por nombre/email.
  3. Paginación server-side.
- **Deliverables**: página + componentes de tabla y filtros.
- **Criterio de aceptación**: filtros funcionan combinados; URL refleja el estado (`searchParams`).
- **Depende de**: T07, T05

### T14 · Detalle de Order + status timeline
- **Estado**: [x]
- **Objetivo**: Gestionar el ciclo de vida de una orden.
- **Acciones**:
  1. Página `/admin/orders/[id]` con secciones: Customer, Plan & Add-ons, Addresses, Payment, Schedule, Status Timeline.
  2. Action `changeOrderStatus(orderId, status, notes?)` que inserta en `order_status_history` con `changed_by = clerk userId`.
  3. Action `rescheduleOrder(orderId, scheduled_at)` que valida la ventana (Lun–Sáb, 8–17, futuro) y deja status en `Scheduled`.
  4. Componente Timeline en `components/admin/order-timeline.tsx`.
- **Deliverables**: página, actions, timeline.
- **Criterio de aceptación**: cambiar status crea entrada en historial; reschedule valida ventana; payment_data se muestra (admite mostrar oculto con toggle).
- **Depende de**: T13

### T15 · Customers (listado + detalle)
- **Estado**: [ ]
- **Objetivo**: Vista de clientes registrados.
- **Acciones**:
  1. `/admin/customers` con tabla (nombre, email, phone, # órdenes, última orden).
  2. `/admin/customers/[id]` con info personal + lista de órdenes.
- **Deliverables**: páginas.
- **Criterio de aceptación**: links cruzados entre customer ↔ orders funcionan.
- **Depende de**: T13

---

## Fase 2 — Landing pública

### T16 · Layout público y navegación
- **Estado**: [ ]
- **Objetivo**: Shell de la landing.
- **Acciones**:
  1. `app/(public)/layout.tsx` con header (logo + nav) y footer.
  2. Header con anchor links a las secciones (`#why`, `#providers`, `#how`, `#faq`, `#testimonials`).
  3. Footer con links a `/legal/terms`, `/legal/privacy`, contact placeholder.
  4. Mobile menu con shadcn `Sheet`.
- **Deliverables**: layout + header + footer.
- **Criterio de aceptación**: navegación funciona en mobile y desktop; anchors hacen scroll suave.
- **Depende de**: T03

### T17 · Hero con buscador ZIP
- **Estado**: [ ]
- **Objetivo**: CTA principal funcional.
- **Acciones**:
  1. Componente `<HeroSearch>` con input que acepta ZIP de 5 dígitos o dirección libre.
  2. Validación cliente: si son 5 dígitos → ZIP path, si no → address path.
  3. Submit redirige a `/checkout?zip=12345` (o con query `address=`).
  4. Aplicar el motivo visual de marca: fondo del hero con `--mahalo-gradient-soft` o arcos Wi-Fi decorativos a baja opacidad (ver `design-system.md` §3 y §8). Headline en `navy-900`, eyebrow en `blue-600` uppercase tracking, CTA `primary` con gradiente.
- **Deliverables**: hero + componente de búsqueda.
- **Criterio de aceptación**: input vacío bloquea submit; ZIP inválido muestra error inline.
- **Depende de**: T16

### T18 · Secciones informativas
- **Estado**: [ ]
- **Objetivo**: Why, Providers, How It Works, FAQ, Testimonials.
- **Acciones**:
  1. Componentes en `components/landing/`: `WhyChooseUs`, `ProvidersGrid` (lee de DB), `HowItWorks` (3 pasos), `Faq` (shadcn `Accordion` con contenido placeholder), `Testimonials` (placeholder).
  2. Composición en `app/(public)/page.tsx`.
- **Deliverables**: secciones renderizadas.
- **Criterio de aceptación**: `ProvidersGrid` muestra logos reales desde DB; resto con contenido placeholder claramente marcado.
- **Depende de**: T17, T08
- **Bloqueada por cliente**: contenido FAQ y testimonials.

### T19 · Wrapper USPS API
- **Estado**: [ ]
- **Objetivo**: Validar dirección/ZIP server-side.
- **Acciones**:
  1. `lib/usps/client.ts` con función `validateAddress(input)` que detecta si es ZIP o address y llama al endpoint correspondiente.
  2. Tipos: `{ ok: true, zip, normalized: {...} } | { ok: false, error }`.
  3. Manejo de errores y rate limit (cache simple en memoria 60s por input).
- **Deliverables**: wrapper + tipos.
- **Criterio de aceptación**: con un ZIP válido retorna info; con basura retorna error tipado.
- **Depende de**: T05
- **Bloqueada por cliente**: credenciales USPS reales (mockear en dev).

### T20 · Lookup de proveedores por ZIP
- **Estado**: [ ]
- **Objetivo**: Decidir cobertura.
- **Acciones**:
  1. Server action `getAvailableProviders(zip)` que: valida ZIP con USPS (T19) → consulta `findProvidersByZip` (T11) → retorna proveedores activos con sus planes activos ordenados.
  2. Tipo de retorno claro para consumir en UI del embudo.
- **Deliverables**: action + types.
- **Criterio de aceptación**: ZIP cubierto retorna >=1 proveedor con planes; ZIP sin cobertura retorna lista vacía.
- **Depende de**: T11, T19

### T21 · Páginas legales
- **Estado**: [ ]
- **Objetivo**: Terms y Privacy accesibles.
- **Acciones**:
  1. `app/(public)/legal/terms/page.tsx` y `legal/privacy/page.tsx` con texto placeholder y `<!-- TODO: legal content -->`.
- **Deliverables**: dos páginas.
- **Criterio de aceptación**: links del footer funcionan.
- **Depende de**: T16
- **Bloqueada por cliente**: textos legales finales.

### T22 · SEO básico
- **Estado**: [ ]
- **Objetivo**: Metadata y discoverability.
- **Acciones**:
  1. `metadata` en root layout: title template, description, OG tags placeholder.
  2. `app/sitemap.ts` y `app/robots.ts`.
  3. Open Graph image placeholder en `public/og.png`.
- **Deliverables**: archivos de metadata.
- **Criterio de aceptación**: `/sitemap.xml` y `/robots.txt` responden.
- **Depende de**: T16

---

## Fase 3 — Embudo de compra

### T23 · Estado del embudo + draft order
- **Estado**: [ ]
- **Objetivo**: Persistencia entre pasos.
- **Acciones**:
  1. Action `createDraftOrder({ zip, address })` que crea fila `orders` con status `Draft` y retorna `orderId`.
  2. Cookie firmada `mahalo_order_id` con `orderId` (httpOnly, sameSite=lax).
  3. Helper `getCurrentDraft()` para usar en cada paso.
  4. Layout `app/(public)/checkout/layout.tsx` con stepper (1–8).
- **Deliverables**: actions, helpers, layout con stepper.
- **Criterio de aceptación**: avanzar y refrescar mantiene el estado; el draft se ve en `/admin/orders` con status `Draft`.
- **Depende de**: T20

### T24 · Paso 2 — Provider & Plan
- **Estado**: [ ]
- **Objetivo**: Cliente elige plan.
- **Acciones**:
  1. Página `checkout/plan` que llama `getAvailableProviders(draft.zip)`.
  2. Render con cards branded (color y logo del proveedor) — variante: agrupado por proveedor.
  3. Si lista vacía: mensaje "No coverage" con CTA a volver al inicio.
  4. Click en "Select Plan" → action `selectPlan(orderId, planId)` → redirect a `checkout/add-ons` (o `summary` si el proveedor no tiene add-ons).
- **Deliverables**: página, componente PlanCard, action.
- **Criterio de aceptación**: la card respeta `provider.primary_color`; selección persiste en `orders.plan_id`.
- **Depende de**: T23

### T25 · Paso 3 — Add-ons
- **Estado**: [ ]
- **Objetivo**: Selección opcional.
- **Acciones**:
  1. Página `checkout/add-ons` (skip automático si `providerHasActiveAddOns` es false).
  2. Lista con checkboxes; "Skip" y "Continue" ambos válidos.
  3. Action `selectAddOns(orderId, addOnIds[])`.
- **Deliverables**: página + action.
- **Criterio de aceptación**: skip avanza directo; selección queda en `orders.add_on_ids`.
- **Depende de**: T24

### T26 · Paso 4 — Order Summary
- **Estado**: [ ]
- **Objetivo**: Cliente confirma antes de checkout.
- **Acciones**:
  1. Página `checkout/summary` con plan, add-ons, total estimado (suma de price_standard + sum de add-ons), dirección de instalación.
  2. Botón "Continue" → redirect a `checkout/customer`.
  3. Helper `calculateTotal(order, autopay = false)` reutilizable en pasos 4 y 6.
- **Deliverables**: página + helper.
- **Criterio de aceptación**: total coincide con la suma esperada en varios casos de prueba.
- **Depende de**: T25

### T27 · Paso 5 — Customer Info
- **Estado**: [ ]
- **Objetivo**: Datos personales.
- **Acciones**:
  1. Form con react-hook-form + Zod: First/Last, Email, Phone, Phone Type (radio Mobile/Landline), Installation Address (pre-llenada y editable), toggle "Use different billing address" → fields condicionales.
  2. Action `saveCustomerInfo(orderId, data)` que crea/actualiza `customers` y enlaza a `orders.customer_id`.
- **Deliverables**: form + action.
- **Criterio de aceptación**: validación inline funciona; el toggle de billing muestra/oculta correctamente.
- **Depende de**: T26

### T28 · Paso 6 — Payment Preference
- **Estado**: [ ]
- **Objetivo**: Captura de método de pago.
- **Acciones**:
  1. Toggle Autopay ON/OFF; mostrar diferencia de precio (`price_autopay` vs `price_standard`).
  2. Si Autopay ON: tabs "Card" / "ACH" con sus campos (tarjeta: número, titular, exp `MM/YY`, CVV; ACH: routing, account, type Checking/Savings).
  3. Validación Zod (Luhn opcional para tarjeta).
  4. Action `savePayment(orderId, payment)` que persiste en `orders.payment_data` (jsonb plain text) y `autopay_enabled`.
  5. Comentario `// SECURITY: stored in plain text per requirement; PCI is client responsibility` arriba del action.
- **Deliverables**: form + action.
- **Criterio de aceptación**: si Autopay OFF, no se piden campos de pago.
- **Depende de**: T27

### T29 · Paso 7 — Installation Schedule
- **Estado**: [ ]
- **Objetivo**: Cliente elige fecha/hora.
- **Acciones**:
  1. Date picker (shadcn `Calendar`) restringido a Lun–Sáb y futuro.
  2. Time slots de 8:00 a 17:00 cada hora.
  3. Action `scheduleInstallation(orderId, scheduled_at)` con misma validación.
- **Deliverables**: página + action.
- **Criterio de aceptación**: domingos y horas fuera de rango deshabilitados visualmente y rechazados server-side.
- **Depende de**: T28

### T30 · Paso 8 — Confirmation + commit
- **Estado**: [ ]
- **Objetivo**: Cerrar el flujo.
- **Acciones**:
  1. Action `submitOrder(orderId)` que: valida que todos los campos requeridos estén → cambia status a `Pending` → inserta `order_status_history` → llama `sendNewOrderEmail` (T32) y `triggerWebhook` (T33).
  2. Página `checkout/confirmation` que llama el action y muestra el mensaje del PDF (agente contactará para verificar SSN/DOB).
  3. Limpiar cookie `mahalo_order_id`.
- **Deliverables**: action + página.
- **Criterio de aceptación**: tras confirmación, la orden aparece en `/admin/orders` como `Pending`; email + webhook disparados.
- **Depende de**: T29, T32, T33

### T31 · Validación E2E del embudo
- **Estado**: [ ]
- **Objetivo**: QA manual del flujo completo.
- **Acciones**:
  1. Probar el embudo en mobile (DevTools 375px) y desktop con un ZIP cubierto y otro sin cobertura.
  2. Verificar branding por proveedor en step 2.
  3. Levantar dev server (`npm run dev`) y recorrer los 8 pasos.
  4. Documentar bugs encontrados en `specs/qa-checkout.md` y resolverlos.
- **Deliverables**: checklist firmado en `specs/qa-checkout.md`.
- **Criterio de aceptación**: cero bloqueantes; bugs menores con issue creado.
- **Depende de**: T30

---

## Fase 4 — Notificaciones

### T32 · Email "new order" con Resend
- **Estado**: [ ]
- **Objetivo**: Notificar al admin/agente.
- **Acciones**:
  1. `lib/resend/client.ts` (singleton).
  2. Plantilla en `lib/resend/templates/new-order.tsx` (React Email opcional, o HTML simple) con resumen: customer, provider, plan, add-ons, total, scheduled_at, addresses.
  3. Función `sendNewOrderEmail(orderId)` que lee la orden completa y envía a `getSetting('notification_email')` con `from = RESEND_FROM_EMAIL`.
- **Deliverables**: client + template + función.
- **Criterio de aceptación**: en dev con sandbox de Resend, el email llega con todos los campos.
- **Depende de**: T12, T05
- **Bloqueada por cliente**: API key Resend + dominio verificado.

### T33 · Webhook a n8n
- **Estado**: [ ]
- **Objetivo**: Disparar automatización externa.
- **Acciones**:
  1. `lib/webhook/trigger.ts` con función `triggerWebhook(orderId)`.
  2. Lee `getSetting('webhook_url')`; si no está configurado, log warn y noop.
  3. Hace POST con payload JSON completo (orden + customer + plan + add-ons resueltos).
  4. Reintento simple: 1 retry con backoff de 2s; logs en ambos intentos.
  5. Timeout de 5s por intento.
- **Deliverables**: función + tipos del payload.
- **Criterio de aceptación**: con `webhook_url = https://webhook.site/...` el payload llega completo.
- **Depende de**: T12, T05

### T34 · Integrar notificaciones al submitOrder
- **Estado**: [ ]
- **Objetivo**: Disparar ambas en T30.
- **Acciones**:
  1. En `submitOrder` llamar a T32 y T33 en paralelo con `Promise.allSettled` (que un fallo no bloquee el otro).
  2. Loguear ambos resultados; nunca fallar la orden por un error de notificación.
  3. Test manual con un endpoint dummy de webhook.
- **Deliverables**: integración + logs.
- **Criterio de aceptación**: si webhook falla, email igual se envía y la orden queda `Pending` correctamente.
- **Depende de**: T30, T32, T33

---

## Fase 5 — Hardening & deploy

### T35 · Manejo de errores y páginas 404/500
- **Estado**: [ ]
- **Objetivo**: UX consistente ante fallos.
- **Acciones**:
  1. `app/not-found.tsx` y `app/error.tsx` (global).
  2. Error boundaries en áreas críticas (`/admin`, `/checkout`).
  3. Logger simple `lib/logger.ts` (console por ahora, abstrayendo para futura integración).
- **Deliverables**: páginas + logger.
- **Criterio de aceptación**: forzar un error en una action muestra la página de error sin trace al usuario.
- **Depende de**: T31

### T36 · Auditoría de accesibilidad
- **Estado**: [ ]
- **Objetivo**: A11y razonable.
- **Acciones**:
  1. Revisar landing y embudo con axe DevTools.
  2. Asegurar labels en todos los inputs, focus visible, contraste AA, navegación por teclado.
  3. Documentar en `specs/qa-a11y.md`.
- **Deliverables**: ajustes de código + checklist.
- **Criterio de aceptación**: cero issues "serious"/"critical" en axe en landing y checkout.
- **Depende de**: T35

### T37 · Performance Lighthouse
- **Estado**: [ ]
- **Objetivo**: >90 perf mobile en landing.
- **Acciones**:
  1. Lighthouse mobile a `/`.
  2. Optimizar: `next/image` para logos, lazy load secciones below-the-fold, fonts con `next/font`.
  3. Documentar en `specs/qa-perf.md`.
- **Deliverables**: ajustes + reporte.
- **Criterio de aceptación**: Performance >=90, Best Practices >=95.
- **Depende de**: T36

### T38 · Seed de datos de staging
- **Estado**: [ ]
- **Objetivo**: Demo data realista.
- **Acciones**:
  1. Extender `lib/db/seed.ts` con: planes ejemplo por cada uno de los 8 proveedores, add-ons demo, ~20 ZIPs distribuidos.
  2. Script `npm run db:seed:demo`.
- **Deliverables**: seed extendido.
- **Criterio de aceptación**: tras seed, la landing con un ZIP cubierto muestra >=2 proveedores con planes.
- **Depende de**: T11

### T39 · Configurar Dokploy
- **Estado**: [ ]
- **Objetivo**: Deploy automatizado.
- **Acciones**:
  1. Crear app en Dokploy apuntando al repo.
  2. Configurar variables de entorno productivas.
  3. Volumen para `public/uploads`.
  4. Health check en `/api/health` (crear endpoint simple).
- **Deliverables**: app desplegada en URL de staging.
- **Criterio de aceptación**: build pasa en Dokploy y la URL responde con la landing.
- **Depende de**: T04
- **Bloqueada por cliente**: VPS Dokploy + dominio.

### T40 · Smoke test post-deploy
- **Estado**: [ ]
- **Objetivo**: Validar producción.
- **Acciones**:
  1. Crear una orden de prueba real desde la landing en staging.
  2. Verificar que el email llegó al `notification_email` configurado.
  3. Verificar que el webhook se disparó (logs n8n).
  4. Verificar que la orden aparece en `/admin/orders`.
- **Deliverables**: reporte en `specs/qa-smoke.md`.
- **Criterio de aceptación**: los 4 puntos verificados ✓.
- **Depende de**: T39, T34

---

## Pendientes del cliente (inputs externos)
- ~~Logo y paleta corporativa Mahalo Enterprise~~ ✓ resuelto (`public/logo.png` + `specs/design-system.md`).
- Versión SVG vectorial del logo y versión monocroma blanca para fondos oscuros.
- Referencias visuales adicionales / mood board (opcional).
- Decisión: orden de display de planes en paso 2 (proveedor → planes vs todos los planes juntos).
- Textos legales (Terms & Conditions, Privacy Policy).
- Contenido de FAQ y Testimonials.
- Credenciales de USPS API.
- Setup de aplicación Clerk + flow de invitación de usuarios.
- API key de Resend + dominio verificado.
- Decisión sobre cifrado de payment_data en reposo.
- Bulk import de ZIPs por CSV (sprint futuro).
