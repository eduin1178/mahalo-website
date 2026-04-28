# Notes — Next.js 16 (v16.2.4)

Cambios incompatibles que afectan al proyecto Mahalo Enterprise. Fuente: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` y guías relacionadas.

Este documento solo recoge lo **relevante** para nuestro stack (App Router, server actions, middleware, Drizzle/Postgres, Clerk, Resend, USPS, n8n webhook, Docker standalone, embudo de checkout). No es una traducción del changelog.

---

## 1. Async Request APIs — breaking
En v16 ya **no existe** la compatibilidad sincrónica que v15 mantuvo de forma temporal. Todo lo siguiente es `Promise` y debe leerse con `await`:

- `cookies()` → `await cookies()`
- `headers()` → `await headers()`
- `draftMode()` → `await draftMode()`
- `params` en `layout.js`, `page.js`, `route.js`, `default.js`, `opengraph-image`, `icon`, etc.
- `searchParams` en `page.js`

Implicaciones para nuestras tareas:
- **T13 / T14** (orders listado y detalle): la página leerá `searchParams` para filtros y paginación → `const sp = await props.searchParams`.
- **T08, T09, T14, T15, etc.** (rutas dinámicas tipo `/admin/providers/[id]`): `const { id } = await props.params`.
- **T23** (cookie firmada `mahalo_order_id`): `const store = await cookies()` antes de `.get()` / `.set()`.
- **T06** (Clerk): nuestro helper `requireRole` usa `auth()` (de Clerk, no de Next) → no aplica el await de `cookies/headers` directamente, pero sí cualquier wrapper propio que lea `headers()`.

Tipos: usar los helpers globales `PageProps<'/ruta/[param]'>`, `LayoutProps<...>`, `RouteContext<...>` generados por `npx next typegen`. Documentar en T02/T03 que se ejecute al menos una vez tras instalar deps.

## 2. `middleware` → `proxy` (deprecado, no eliminado aún)
- El archivo `middleware.ts` y la función `middleware` siguen funcionando pero están deprecados; el nuevo nombre es `proxy.ts` con función `proxy()`.
- **Pero `proxy` solo soporta runtime nodejs**, no edge.
- Clerk hoy expone `clerkMiddleware()` y la documentación de Clerk asume `middleware.ts`. **Decisión**: mantenemos `middleware.ts` (T06) hasta que Clerk publique guía oficial para `proxy`. Aceptamos el warning de deprecación.
- Si más adelante migramos: renombrar archivo, renombrar función, y revisar las flags `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

## 3. Caching APIs (afecta server actions)
- `revalidateTag(tag)` ahora **requiere segundo argumento** con un `cacheLife` profile. Llamada antigua produce error TS. Reemplazo: `revalidateTag('orders', 'max')`.
- Nueva API `updateTag(tag)` (solo dentro de server actions): expira y refresca en el mismo request — *read-your-writes*. Apropiado para flujos donde el usuario espera ver el cambio inmediato (ej. admin cambiando status de orden, T14).
- Nueva API `refresh()` desde `next/cache` — refresca el router del cliente desde una server action. Útil tras `changeOrderStatus` o `selectPlan` para no usar `revalidatePath` cuando solo queremos re-render.
- `cacheLife` y `cacheTag` salen de `unstable_`. Importar directamente: `import { cacheLife, cacheTag } from 'next/cache'`.

Recomendación para el proyecto:
- Server actions de admin (cambios en providers, plans, add-ons, coverage, settings, orders): usar `updateTag` con tags por entidad (`'providers'`, `'orders'`, `'plans:{providerId}'`).
- En listados que dependen de esos tags, usar `cacheTag` dentro de la query (`lib/.../queries.ts`).
- Si tras una mutación queremos solo refrescar la UI sin invalidar tags, `refresh()`.

## 4. Turbopack por defecto
- `next dev` y `next build` corren con Turbopack sin necesidad de `--turbopack`. El flag estorba pero no rompe.
- **Acción concreta**: limpiar `package.json` scripts cuando lleguemos a T02 — quitar `--turbopack` si Create Next App lo dejó.
- No definimos config `webpack` propia → no hay riesgo de fallo de build.
- `experimental.turbopack` es ahora `turbopack` top-level en `next.config.ts` (no usamos hoy, pero anotar).

## 5. `output: 'standalone'` — sin cambios funcionales
Sigue siendo el mecanismo recomendado para Docker. Validado para T04. Solo recordar que ahora `next dev` escribe en `.next/dev` y `next build` en `.next` separados, así que el Dockerfile multi-stage debe copiar de `.next/standalone` y `.next/static` igual que antes — sin sorpresas.

## 6. Parallel routes — `default.js` requerido
Si llegamos a usar parallel routes (`@modal`, `@sidebar`, etc.), cada slot requiere `default.tsx` o el build falla. Hoy no los usamos, pero si T07 (sidebar admin) o el stepper de checkout T23 termina usando parallel routes, tenerlo presente.

## 7. `next/image`
Cambios que pueden mordernos:
- `images.domains` → **deprecado**. Usar `images.remotePatterns`. Importante si en algún momento servimos avatares de Clerk o assets externos.
- `dangerouslyAllowLocalIP` ahora es `false` por defecto — afecta dev si optimizamos imágenes desde `localhost:xxxx`.
- `images.qualities` por defecto `[75]`. Si pasamos `quality={90}` se "snapeará" a 75 a menos que lo declaremos.
- Local images con query string (`/foo?v=1`) requieren `images.localPatterns.search`. No relevante hoy.
- `minimumCacheTTL` pasa de 60s a 4h. Suficiente para logos de proveedores (T08); si necesitamos refresh inmediato tras subir nuevo logo, considerar invalidar con un `?v=hash` y declarar `localPatterns`.

## 8. Removidos
- `next lint` removido. `next build` ya no corre lint. Si queremos lint en CI, llamar a ESLint o Biome directamente (no afecta T02).
- `serverRuntimeConfig` / `publicRuntimeConfig` removidos. No los usamos — accedemos a `process.env` directo.
- `experimental.dynamicIO` → renombrado a `cacheComponents` top-level. No lo usamos.
- AMP: no aplica.

## 9. Server actions — sigue igual en lo esencial
- Directiva `"use server"` (file-level o inline) sin cambios.
- Las acciones siguen siendo POST y reachable directamente → la nota de seguridad del doc oficial aplica: **validar auth y autorización dentro de cada server action** (T08–T15 admin). Nuestro plan de Zod + `requireRole` ya cubre esto.
- `useActionState` (antes `useFormState`) es la API recomendada para estado pendiente.
- `cookies()` async (ya cubierto en §1) afecta a T23.

## 10. React 19.2 + Compiler
- App Router usa React 19.2 (canary built-in). Disponibles `useEffectEvent`, `<Activity>`, View Transitions.
- React Compiler estable pero **off por defecto**. No habilitar todavía: requiere `babel-plugin-react-compiler` y aumenta tiempos de build. Reevaluar al cierre de fase 5 si vemos rerenders problemáticos.

## 11. Routing y prefetching
Mejoras automáticas (layout dedup, prefetch incremental). Sin cambios de código. Solo nota: en DevTools veremos más requests pequeños, no es regresión.

## 12. Otros
- `data-scroll-behavior="smooth"` en `<html>` si queremos que Next preserve el override de scroll-behavior durante navegaciones. Para nuestros anchor links del landing (T16) lo más simple es no setear `scroll-behavior: smooth` global y manejarlo con JS o nativo.
- `next dev` ya **no carga `next.config` dos veces** → si en `next.config.ts` queremos detectar dev, usar `process.env.NODE_ENV === 'development'`, no `process.argv.includes('dev')`.

---

## Conclusión sobre `plan.md`
Las decisiones del plan técnico **siguen siendo válidas**. Ajustes finos a propagar:

1. **§5 Estado del embudo**: la cookie `mahalo_order_id` se lee con `await cookies()`. Documentado en T23 cuando se implemente.
2. **§6 Auth y roles**: middleware sigue como `middleware.ts`; aceptamos warning de deprecación hasta guía oficial de Clerk para `proxy`.
3. **§9 Variables de entorno**: ningún cambio.
4. **§11 Convenciones de código**: agregar regla "Las server actions usan `updateTag` para mutaciones admin que requieren read-your-writes; `revalidateTag(tag, 'max')` para listados públicos; `refresh()` para refrescar router cliente sin invalidar caché."
5. **Tasks afectadas que deben recordar el await**: T13, T14, T15, T08, T09 (params/searchParams async), T23 (cookies async).

No se requieren cambios estructurales al plan. Esta nota es la referencia rápida para futuras sesiones de implementación.
