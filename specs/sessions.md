# Sessions log — Mahalo Enterprise

Bitácora cronológica de sesiones de implementación. Cada entrada se anexa al cierre de una sesión por la skill `/implement` (ver `.claude/skills/implement/SKILL.md`).

## 2026-04-28 · T21 — Páginas legales

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `specs/tasks.md` — T21 marcada `[x]`.
- **Decisiones clave**:
  - Los archivos `app/(public)/legal/terms/page.tsx` y `legal/privacy/page.tsx` ya habían sido creados durante T16 con placeholder y marcador `// TODO: legal content`. No se reescribieron — cumplen el criterio tal cual.
- **Gotchas / aprendizajes**:
  - Auditoría rápida confirmó que el footer (`components/landing/nav-config.ts`) ya enlaza a las dos rutas. T16 anticipó el deliverable de T21.
- **Pendiente para próxima sesión**:
  - Cliente: textos legales finales para reemplazar el placeholder.
- **Verificación realizada**:
  - `npm run build` → ✓ ambas rutas se prerenderizan como estáticas (`○ /legal/privacy`, `○ /legal/terms`).


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

## 2026-04-28 · T20 — Lookup de proveedores por ZIP

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `lib/coverage/availability.ts` — nuevo. `getAvailableProviders(input)` compone `validateAddress` (T19) + `findProvidersByZip` (T11) + un `select` con `inArray` sobre `plans` activos. Devuelve `AvailabilityResult` (discriminated union ok/error) con `providers: { provider, plans }[]`.
- **Decisiones clave**:
  - **Acepta `input` (no solo `zip`)** porque T19 ya clasifica ZIP vs address libre. La landing puede pasar lo que el usuario tipeó sin pre-validar; el ZIP normalizado vuelve en `result.zip` para guardarlo en el draft order (T23).
  - **Filtra proveedores sin planes activos**: la criterio dice ">=1 proveedor con planes". Un provider cubierto pero sin plan activo es ruido para el embudo (no hay nada que mostrar en step 2). Si hace falta listarlos en otro contexto, exponer un flag `includeEmpty` más adelante.
  - **Batch query con `inArray`** en vez de N+1 con `listPlansByProvider`: una sola consulta agrupa los planes por `providerId` en memoria. Coherente con que la landing puede listar 4–6 proveedores en zonas saturadas.
  - Ubicado en `lib/coverage/` (no `lib/checkout/`) porque es lookup de cobertura — el embudo lo consume pero el módulo es independiente del estado del draft.
- **Gotchas / aprendizajes**:
  - `findProvidersByZip` ya filtra `providers.is_active = true`, así que no hay que repetirlo aquí. Pero los **planes** sí necesitan filtro explícito `is_active = true` (T09 permite togglear).
  - Reutilizar el código de error de USPS (`ValidateAddressErrorCode`) en el tipo de respuesta evita inventar otro vocabulario; la UI del embudo (T24) discrimina por el mismo `error.code`.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (7.1s), TypeScript ok.
  - Lectura cruzada: `findProvidersByZip` retorna `[]` para ZIP no cubierto → `getAvailableProviders` retorna `{ ok: true, zip, providers: [] }` (criterio "ZIP sin cobertura retorna lista vacía").
- **Pendiente para próxima sesión**:
  - T21 (legales) o T22 (SEO) son las siguientes en fase 2 sin dependencias bloqueadas. T23 (embudo) ya tiene a T20 como dependencia resuelta.

## 2026-04-28 · T19 — Wrapper USPS API

- **Estado final**: ✅ completada (mock mode; real USPS path implementado pero no ejercitado por falta de credenciales).
- **Archivos tocados**:
  - `lib/usps/classify.ts` — `classifyInput(raw)` discriminated union (`empty | zip | address | invalid`). Address devuelve `extractedZip` cuando contiene `\b\d{5}(?:-\d{4})?\b` (regex acepta ZIP+4 pero conserva sólo los 5). Aislado del cliente para que T20 (server action `getAvailableProviders`) y, si conviene, `hero-search.tsx` lo compartan en el futuro sin importar `server-only`.
  - `lib/usps/client.ts` — `validateAddress(input)` con tipos `ValidateAddressOk | ValidateAddressError` (códigos `empty | invalid_format | not_found | upstream | rate_limited`). Cache `Map<string, {value, expiresAt}>` TTL 60s, evict trivial cuando `size > 500`. Si `USPS_USER_ID` y `USPS_API_BASE` están seteadas → llama Web Tools legacy (`API=CityStateLookup` para ZIP, `API=Verify` para address) con XML armado por string-templating + `escapeXml`/`decodeXml`. Sin libs XML: `extractTag(body, "City"|"State"|"Zip5"|"Description")` con regex case-insensitive cubre la respuesta esperada. Si no hay creds → mock determinista: ZIP retorna `{zip}` sin city/state; address retorna `{street, zip}` si pudo extraer ZIP, error `not_found` si no. Timeout 5s con `AbortController`. `import "server-only"` en línea 1.
- **Decisiones clave**:
  - **Mock por defecto, real por env-presence**: el task estaba "Bloqueada por cliente: credenciales USPS reales". En vez de stub-or-real con flag explícito, el switch es `process.env.USPS_USER_ID && process.env.USPS_API_BASE`. Cuando el cliente entregue creds, basta pegarlas en `.env`; sin redeploys de código. Coherente con `lib/resend/client.ts`/`lib/webhook/trigger.ts` previstos en T32/T33 (mismo patrón "noop si no configurado").
  - **API legacy XML, no la nueva REST OAuth2** (apis.usps.com): los env vars en `.env.example` (`USPS_USER_ID`, `USPS_API_BASE`) datan de la decisión inicial del cliente y apuntan al estilo Web Tools. La API legacy sigue activa en abril 2026 según el contrato actual de USPS; si migra, sólo cambian `lookupZipReal`/`verifyAddressReal` (interfaz pública estable). Documentar al cliente que si entrega un OAuth client_id/secret habrá que swappear esas dos funciones.
  - **Regex parser en lugar de DOMParser/xml2js**: la respuesta de Web Tools es plana (1 nivel de tags relevantes); regex `<Tag>([^<]*)</Tag>` cubre 100% de los casos sin agregar dep. Trade-off: si USPS devuelve el tag con atributos o anidado, el parser falla → return `upstream`. Aceptable; los endpoints `CityStateLookup` y `Verify` no anidan.
  - **`source: "usps" | "mock"`** en el resultado: T20 puede loguearlo o mostrar warning en admin si está corriendo en producción con mock activo (smell test "olvidamos las creds").
  - **Cache key = `input.trim().toLowerCase()`**: `33101`, `33101 ` y `33101 ` colisionan (deseado). Address con espacios distintos colisionan igual. Si en el futuro un usuario hace `Validate Address NY` vs `validate address ny` ambos se cachean igual — no problemático para el caso uso.
  - **Cache eviction trivial** (delete oldest cuando >500): no es LRU real, es FIFO. Suficiente para 60s TTL en un solo proceso; el Map nunca debería crecer mucho. Si pasa a multi-instance/serverless, mover a Redis (T20 puede vivir sin esto).
  - **`import "server-only"`** en cliente: protege contra import accidental desde un client component (env vars con `process.env.X` no-public se serializarían a `undefined` en el bundle de cliente y caería al mock silenciosamente — peor que un build error). Costo: requiere shim en smoke tests fuera de Next.
- **Gotchas / aprendizajes**:
  - **`server-only` rompe `tsx`/Node fuera del compilador de Next**: el módulo throw-on-import en runtime puro. Para smoke tests fuera de Next hay que monkey-patch `Module._resolveFilename` redirigiendo `"server-only"` a un noop CJS. Patrón aplicable a futuros wrappers (Resend/USPS/Webhook): si quiero smoke con `tsx` directo, dejar el smoke como archivo efímero con el shim, no en repo permanente. (Smoke `smoke-t19.ts` borrado tras verificación.)
  - **Regex case-insensitive `[^<]*` no soporta `&amp;` recursivos**: el `decodeXml` posterior los traduce, pero si el contenido del tag tiene `<` literal (escapado como `&lt;`) el match captura igual. OK para campos que USPS no escapa con `<`/`>` (city names, state codes, ZIP).
  - **`AbortController` + `clearTimeout` en finally**: patrón estándar Next 16 fetch (no edge-case). El error `name === "AbortError"` permite distinguir timeout de network failure y dar mensaje útil.
  - **Address sin ZIP → `not_found`** (no `invalid_format`): la dirección puede ser válida pero faltarle ZIP. Distinguirlo del formato roto ayuda a la UI a guiar al usuario ("agregue su ZIP" vs "input inválido"). T20 puede traducir a copy específico.
  - **`addAddress` legacy XML acepta `Address2` para la calle** (sí, contraintuitivo: Address1 es opcional/secundaria como apartamento, Address2 es la línea principal). Documentado en USPS Web Tools docs; el wrapper lo respeta.
- **Verificación realizada**:
  - `rm -rf .next && npm run build` → ✓ Compiled successfully; no rutas nuevas. TypeScript ok.
  - Smoke (`smoke-t19.ts` efímero, ya borrado) cubrió 8 casos: empty → `empty`; ZIP `33101` → ok mock con `zip=33101`; numérico corto/largo → `invalid_format`; address con ZIP → ok extrayendo `20500`; address sin ZIP → `not_found`; garbage `ab` → `invalid_format` con mensaje "Enter a 5-digit ZIP code or a full address."; repeat ZIP → cache hit (mismo objeto serializado, mismo `source: "mock"`). Todos los outputs coinciden con los tipos `ValidateAddressResult` exportados ✓.
  - **Limitación**: el path real USPS (`lookupZipReal`/`verifyAddressReal`) no se ejerció. Cuando el cliente entregue `USPS_USER_ID` válido, smoke con `33101` debería retornar `source: "usps"` con `city: "MIAMI"`, `state: "FL"`. Sin creds, el wrapper se mantiene 100% mockeado y deterministic.
- **Pendiente para próxima sesión**:
  - **T20 — Lookup de proveedores por ZIP**. Server action `getAvailableProviders(zip)` que: ejecuta `validateAddress(zip)` (T19) → si `ok` consulta `findProvidersByZip(result.zip)` (T11) → para cada proveedor activo lee planes activos ordenados (`listPlansByProvider` filtrado). Tipo de retorno claro para consumir en `checkout/plan` (T24). Si `validateAddress` retorna `error.code === "not_found"` → retornar lista vacía con metadata; si `invalid_format` → propagar el mensaje al UI.
  - Cuando lleguen creds USPS reales: smoke con `33101`/`90210` debe retornar `source: "usps"` y enriquecer city/state. Considerar exponer un script `scripts/check-usps.ts` para validar la integración antes de deploy.
  - Si T17 (`hero-search.tsx`) quiere validación más estricta antes del redirect, puede importar `classifyInput` desde `lib/usps/classify.ts` (no requiere `server-only`) — ya está aislado para ese reuso.

## 2026-04-28 · T18 — Secciones informativas

- **Estado final**: ✅ completada (build verde; smoke visual pendiente de `npm run dev`).
- **Archivos tocados**:
  - `components/landing/why-choose-us.tsx` — server; 4 cards (MapPin/Zap/HeartHandshake/ShieldCheck) en grid `sm:2 lg:4`, fondo `bg-background`, cards `bg-surface`. Iconos en círculo `bg-mahalo-cyan-300/20` con icono `text-mahalo-blue-600` (§7 design-system).
  - `components/landing/providers-grid.tsx` — server async; `await listProviders()` filtrado por `isActive`. Grid `2/3/4` columnas. Cada card lleva borde superior 4px en `provider.primary_color` (§9 design-system); render condicional: `next/image` sobre `logoUrl` con `max-h-12 object-contain`, fallback a `name` text. Empty state con borde dashed cuando no hay activos. Sección con `bg-surface` para alternar con WhyChooseUs.
  - `components/landing/how-it-works.tsx` — server; 3 pasos numerados, círculos `bg-mahalo-navy-900` con número blanco. `<ol>` semántico con grid `md:3`.
  - `components/landing/faq.tsx` — server; 5 Q&A placeholder envueltos en `Accordion` shadcn (base-ui). `AccordionItem` con `value={item.q}`. Comentario `{/* TODO: replace placeholder content with client-approved copy. */}` arriba.
  - `components/landing/testimonials.tsx` — server; 3 quotes placeholder en `<figure>` con `QuoteIcon` lucide. `bg-background` con cards `bg-surface`. Comentario TODO de placeholder.
  - `app/(public)/page.tsx` — reemplaza el `.map(...)` de placeholders por composición explícita: `Hero → WhyChooseUs → ProvidersGrid → HowItWorks → Faq → Testimonials`. Agrega `export const revalidate = 60` para que la landing siga siendo prerenderable (ISR) pero actualice cuando admin toggle un proveedor.
- **Decisiones clave**:
  - **`revalidate = 60` en lugar de `force-dynamic`**: `ProvidersGrid` lee DB pero la lista cambia con frecuencia muy baja (admin toggles ocasionales). ISR de 60s preserva el `○ static` ⇒ HTML cacheado en CDN (Lighthouse mobile va a agradecerlo en T37) y a la vez el bake-in del build no congela proveedores hasta el próximo deploy. Alternativa rechazada: `revalidatePath('/')` en `lib/providers/actions.ts`. Más exacto pero acopla landing al admin; el admin desconoce la URL pública. ISR pasivo es el contrato más simple.
  - **Alternancia visual de fondos** `background → surface → background → surface → background`: separa secciones sin recurrir a `border-b` extra (que ya cubre el detalle en transiciones bg→bg). Mantiene la jerarquía limpia y respeta §1 design-system ("claridad sobre decoración").
  - **`bg-surface` como utilidad Tailwind**: ya expuesta vía `--color-surface: var(--surface)` en `app/globals.css:25`. Sin tocar tema.
  - **`provider.primaryColor` como `borderTopColor` inline-style** (no class): el color es dato runtime, no se puede generar via Tailwind. Igual patrón que aplicará T24 a las plan cards (§9 design-system). `borderTopWidth: 4` también inline para mantener consistencia con el override.
  - **Empty state explícito en ProvidersGrid**: si no hay proveedores activos en DB, mensaje friendly en card dashed en lugar de grid vacío. Cubre el caso "ambiente fresco sin seed completo".
  - **`<ol>` semántico** en HowItWorks (no `<ul>`): los pasos son ordenados por definición. A11y wins.
  - **No instalé Carousel/Embla** para Testimonials. 3 cards en grid estático cubren el placeholder; cuando llegue copy real del cliente y/o más de 3, evaluar si vale agregar carousel (mobile sí lo querrá).
  - **`QuoteIcon` de lucide** en lugar de carácter `"`: uniforme con resto de iconografía (§7 stroke 1.75) y queda recoloreable a `text-mahalo-blue-600`.
- **Gotchas / aprendizajes**:
  - **Apóstrofes en strings JS** (no JSX): puedes escribir `"don't"` directamente en el array de FAQs, lint no se queja porque no está en posición JSX. Solo `react/no-unescaped-entities` aplica al texto en JSX directo. Ahorra refactor a `&apos;` o `dangerouslySetInnerHTML`. Lección aplicable a futuras data tables/strings constantes.
  - **`AccordionItem` de shadcn (base-ui)** acepta `value: string` (forwardea props). Útil pasar la pregunta como value para tener anclas estables si en el futuro queremos `?faq=...` query.
  - **`/` permanece `○ static` con `revalidate=60`**: el route table muestra `1m  1y` (revalidate / expire). Confirma que el HTML se genera al build y se refresca pasivamente, no per-request — perfil de Lighthouse intacto. Si una sección futura necesita datos per-user, mover esa parte a un client component o RSC con `dynamic = 'force-dynamic'` aislado en un slot.
  - **`max-h-12 w-auto object-contain`** para logos heterogéneos: los proveedores tienen logos con aspect ratios muy distintos (Verizon Fios alto vs Spectrum ancho). Limitar la altura y dejar el width libre con `object-contain` los normaliza visualmente sin distorsionar.
  - El `revalidate` exportado por una page asegura que **toda** la página se trate como ISR — incluido el Hero estático que nunca cambia. Costo despreciable; no vale dividir.
- **Verificación realizada**:
  - `rm -rf .next && npm run build` → ✓ Compiled successfully (22s); TypeScript ok. `/` listada como `○` con revalidate `1m` y expire `1y`. Resto de rutas intactas. Static prerender disparó la query a DB (smoke contra DB en docker funcionó al build, lista de 8 proveedores del seed se baked-in).
  - **Limitación**: animación del accordion, hover de provider cards y border colors por proveedor requieren `npm run dev` en navegador. T31 hará QA visual completo del embudo+landing.
- **Pendiente para próxima sesión**:
  - **T19 — Wrapper USPS API** (Fase 2 sigue). No depende de UI; bloqueado parcialmente por credenciales reales del cliente — implementar con stub/mock por defecto y env-flag para activar el cliente real.
  - Cuando llegue contenido legal/FAQ/testimonials del cliente, reemplazar arrays placeholder en `faq.tsx` y `testimonials.tsx` (búsqueda: `TODO: replace placeholder`).
  - Si admin reporta lag al actualizar proveedores en landing, considerar pasar a `revalidatePath('/')` en `lib/providers/actions.ts` (más reactivo que ISR de 60s).

## 2026-04-28 · T17 — Hero con buscador ZIP

- **Estado final**: ✅ completada (build verde; smoke visual pendiente de `npm run dev`).
- **Archivos tocados**:
  - `components/landing/hero-search.tsx` — client; `<form>` con `<Input>` + `<Button variant="primary">`. Función `classifyInput` decide ZIP vs address vs invalid; submit pushea `/checkout?zip=...` o `?address=...` vía `useRouter`. Errores inline con `aria-invalid` + `aria-describedby`. Botón disabled durante `submitting`.
  - `components/landing/hero.tsx` — server; sección `#hero` con `bg-mahalo-gradient-soft`, headline navy-900, eyebrow blue-600 (utility `.eyebrow`) y `<HeroSearch>`. Decoración `WifiArcsDecoration` (SVG inline) en `absolute -right-24 -bottom-24`, `opacity-[0.07]`, color `text-mahalo-blue-600`.
  - `app/(public)/page.tsx` — reemplaza el placeholder inline `#hero` por `<Hero />`. Las 5 secciones placeholder restantes quedan para T18.
- **Decisiones clave**:
  - **Clasificación de input**: solo dígitos + len 5 → ZIP; solo dígitos + len ≠ 5 → error "ZIP must be exactly 5 digits"; >=4 chars con no-dígitos → address; <4 chars no-numérico → error genérico ("Enter a 5-digit ZIP code or a full address"). Empuja al usuario a un input parseable sin requerir USPS aún (T19/T20). El server validará nuevamente en `/checkout` cuando T19 esté listo.
  - **Redirect `/checkout?zip=...` o `?address=...`** vía `URLSearchParams` (no template literal con `encodeURIComponent` ad-hoc). T23 leerá estos query params para crear el draft order.
  - **Decoración Wi-Fi como SVG inline** en lugar de imagen. Ventajas: hereda `currentColor` (puedo controlar el tinte con `text-mahalo-blue-600`), sin request extra, recolor trivial. Tres arcos + dot reproducen el motivo del logo (§8 design-system).
  - **`opacity-[0.07]`** dentro del rango §8 (5–8%). Suficiente para acompañar sin competir con el headline. Posicionado bottom-right para no chocar con el form en mobile (queda fuera del viewport visual del input).
  - **`isolate overflow-hidden`** en la sección para crear stacking context y recortar el SVG que se extiende más allá del contenedor (negative offsets `-right-24 -bottom-24`).
  - **`relative` en el `div` del contenido** para que el texto/form quede sobre el SVG decorativo sin necesidad de `z-index` explícito.
  - **`autoComplete="postal-code"`** en el input. Es lo más útil dado que la mayoría tipearán ZIP; no rompe el path "address" (el usuario sobrescribe).
  - **Estado `submitting` con botón disabled** en lugar de spinner: el push de `useRouter` es prácticamente instantáneo en client-side nav; el feedback "Checking…" cubre el caso de transición lenta sin agregar dependencia de spinner.
  - **Error vs helper text en el mismo slot** (debajo del form): cuando hay error, lo reemplaza con `role="alert"`; cuando no, muestra helper neutral. Evita layout shift entre estados.
  - **Header CTA "Check Availability" (`/#hero`)** ya creado en T16 sigue válido — apunta exactamente al `id="hero"` que renderiza esta sección. No requiere cambio en `site-header.tsx`.
- **Gotchas / aprendizajes**:
  - **`<Input>` de shadcn/Base UI no acepta `type="number"` para ZIP** sin perder UX (input number ofrece spinner, scroll-wheel mutation, no respeta `inputMode`). Usar `type="text"` + `inputMode="numeric"` es preferible en general; acá uso `inputMode="text"` porque el campo acepta address también. Si más adelante se separa en dos campos, cambiar a `inputMode="numeric"` en el ZIP.
  - **Validación deferida server-side**: T17 valida formato (digit count) pero no si el ZIP existe en la cobertura. Eso es trabajo de T19/T20 (USPS + `findProvidersByZip`). El embudo en T23+ debe tolerar un ZIP "5-digit válido formalmente" que llegue sin cobertura — el paso 2 del embudo muestra "No coverage" según T24.
  - **Next 16 client component en route group `(public)`**: `useRouter` de `next/navigation` (no `next/router`) funciona out-of-the-box. No requirió tocar el layout porque `app/layout.tsx` ya tiene `ClerkProvider` envolviéndolo todo (su provider no rompe `useRouter`).
- **Verificación realizada**:
  - `rm -rf .next && npm run build` → ✓ Compiled successfully (5.5s); TypeScript ok. `/` sigue como `○ static` (Next pre-rendea la landing aunque tenga client components dentro — el form se hidrata en cliente). Admin routes intactas.
  - **Limitación**: validación inline (empty / invalid ZIP), redirect a `/checkout?zip=...` o `?address=...`, hover/focus de gradient button y la decoración Wi-Fi a baja opacidad requieren `npm run dev` y verificación en navegador (375px y desktop). T31 hará QA visual del embudo entero.
- **Pendiente para próxima sesión**:
  - **T18 — Secciones informativas**. Reemplazar placeholders `#why`/`#providers`/`#how`/`#faq`/`#testimonials` con componentes en `components/landing/`. `ProvidersGrid` debe leer DB (depende de T08). Resto con contenido placeholder marcado.
  - Cuando T23 (`createDraftOrder`) esté listo, `/checkout` debe leer `searchParams.zip` o `searchParams.address` y crear el draft con esos campos. El path actual envía a `/checkout` que aún no existe — primer usuario que clickee verá un 404 hasta que T23 cree la ruta. Aceptable: T17 sólo valida que la redirección dispare con el query param correcto.
  - Considerar reusar `classifyInput` desde `lib/checkout/` cuando T19/T20 necesiten el mismo classifier server-side (move a un módulo compartido client+server-safe).

## 2026-04-28 · T16 — Layout público y navegación

- **Estado final**: ✅ completada (build verde; smoke visual pendiente de `npm run dev`).
- **Archivos tocados**:
  - `app/(public)/layout.tsx` — route group `(public)` con `SiteHeader` + `<main>` flex-1 + `SiteFooter` en `min-h-screen flex-col`. El group no afecta la URL (`/` sigue siendo `/`).
  - `app/(public)/page.tsx` — placeholder de landing con secciones ancladas (`#hero`, `#why`, `#providers`, `#how`, `#faq`, `#testimonials`) para validar el scroll suave. Reemplazará T17/T18.
  - `app/(public)/legal/{terms,privacy}/page.tsx` — placeholders mínimos con `metadata` y `<!-- TODO: legal content -->`. Cubre el "Depende de T16" de T21 sin completarlo (T21 sigue `[ ]`).
  - `app/page.tsx` — **eliminado** (era la landing default de Next; conflictúa con `app/(public)/page.tsx` porque ambos resuelven a `/`).
  - `app/globals.css` — `html { scroll-behavior: smooth }` agregado al `@layer base` para los anchors del header/footer.
  - `components/landing/nav-config.ts` — `publicNavItems` (anchors a `/#why`, `/#providers`, `/#how`, `/#faq`, `/#testimonials`) y `publicFooterLinks` (`/legal/terms`, `/legal/privacy`, `mailto:hello@…`).
  - `components/landing/site-header.tsx` — server component; sticky `top-0 z-40` con `backdrop-blur`, logo a la izq, nav anchors al centro (oculto en mobile), CTA `Button variant="primary"` "Check Availability" + `SiteMobileNav` a la der.
  - `components/landing/site-mobile-nav.tsx` — client; reusa `Sheet` (side="right") + `MenuIcon` siguiendo el patrón de `components/admin/mobile-sidebar.tsx`. Cierra al click via `onClick={() => setOpen(false)}`.
  - `components/landing/site-footer.tsx` — server; surface bg, logo + tagline + links + copyright con año dinámico (`new Date().getFullYear()`).
- **Decisiones clave**:
  - **Route group `(public)`** en lugar de mover todo a `/landing/`. La URL pública debe ser `/`. Los grupos de Next App Router permiten un layout separado del de `/admin` sin cambiar el path. El root `app/layout.tsx` (con `ClerkProvider`) sigue envolviendo todo; `(public)/layout.tsx` agrega header/footer encima.
  - **Anchors absolutos `/#why`** (no `#why`): permite que el link funcione desde `/legal/terms` (vuelve a la home y hace scroll). Si el usuario está ya en `/`, el navegador hace scroll sin recargar.
  - **`Logo` reusado** sin variante `white` (header tiene fondo claro/blur). El gradiente del CTA "Check Availability" es la única aparición de marca en el header — alineado con `design-system.md` §3 ("CTA principal de landing").
  - **Header sticky con backdrop-blur** + bg semitransparente. Patrón estándar para landings; mantiene el CTA siempre visible.
  - **`scroll-behavior: smooth` global** (criterio de aceptación: "anchors hacen scroll suave"). Aplicarlo en el `<html>` lo cubre tanto para el header como para los links del footer y de cualquier sección futura.
  - **Mobile menu en `side="right"`** (vs admin que usa `side="left"`). Convención común en sitios públicos: hamburguesa a la derecha → sheet a la derecha.
  - **CTA "Check Availability" en mobile** dentro del Sheet, no fijo en el header (para no comer espacio). Apunta a `/#hero` que en T17 será reemplazado por el buscador real.
  - **`code` con backticks** (`<code>#hero</code>`) en placeholders de página para que sea obvio en visual review qué se construirá en T17/T18 sin generar contenido fake "definitivo".
- **Gotchas / aprendizajes**:
  - **`.next/` cache rompe build tras eliminar `app/page.tsx`.** Primer build falló con `Cannot find module '../../../app/page.js'` desde `.next/dev/types/validator.ts:150`. Solución: `rm -rf .next` y rebuild. Pasa cada vez que se elimina o renombra una page route en este proyecto; recordatorio para futuras refactors de file-system routing.
  - **Conflicto entre `app/page.tsx` y `app/(public)/page.tsx`.** Ambos resuelven a `/`. Next 16 no warned al crear el segundo — el build hace check pero el cache stale del primero confunde la inferencia. Borrar el viejo es obligatorio antes del build limpio.
  - **`SheetContent` width 72** funciona con `w-72` directo (clase Tailwind), igual que admin's `MobileSidebar`. No requiere prop especial del primitive.
  - **`Button` con `render={<Link />}`** es el patrón correcto para componer Base UI primitives con Next Link (igual que en admin). NO usar `asChild`: el wrapper de Base UI es `render`.
- **Verificación realizada**:
  - `rm -rf .next && npm run build` → ✓ Compiled successfully (5.8s); TypeScript ok. Rutas públicas listadas: `/` (○ static), `/legal/privacy` (○), `/legal/terms` (○). Admin routes intactas.
  - **Limitación**: scroll suave + breakpoint mobile/desktop + sticky header requieren `npm run dev` y verificación en navegador (DevTools 375px y 1280px). No bloqueante; T31 hará QA visual completo del embudo.
- **Pendiente para próxima sesión**:
  - **T17 — Hero con buscador ZIP**. Reemplazará la sección `#hero` placeholder con `<HeroSearch>` que valida 5-dígitos vs address, y aplica `--mahalo-gradient-soft` y arcos Wi-Fi (§3, §8). El header CTA "Check Availability" puede quedar como link a `/#hero` o pasar a anchor + focus del input cuando el hero exista.
  - T18 reemplazará las secciones placeholder `#why`, `#providers`, `#how`, `#faq`, `#testimonials` con componentes reales en `components/landing/`.
  - T21 (legal) ya tiene los archivos placeholder creados — sólo falta texto del cliente; no marcar `[x]` hasta que llegue contenido.

## 2026-04-28 · T15 — Customers (listado + detalle)

- **Estado final**: ✅ completada (DB + build verde; UI E2E pendiente de sesión Clerk como T08–T14).
- **Archivos tocados**:
  - `lib/customers/queries.ts` — `listCustomers({search, page, pageSize})` con `leftJoin orders` agregando `count(orders.id)` + `max(orders.createdAt)` agrupado por `customers.id`. **Excluye orders en `Draft`** del agregado vía `and(eq(orders.customerId, customers.id), ne(orders.status, "Draft"))` aplicado al ON de la join (no al WHERE — un WHERE filtraría customers sin orders). Search ilike sobre firstName/lastName/email/phone. `getCustomerById(id)` retorna `customer` + lista de orders con provider/plan resueltos vía leftJoin (incluye drafts en el detalle, son visibles para el agente).
  - `app/admin/(panel)/customers/page.tsx` — listing con tabla shadcn (name link, email, phone, orders count alineado a la derecha, last order date) + paginación link-based replicando el patrón de T13.
  - `app/admin/(panel)/customers/[id]/page.tsx` — detail con sección Personal info + tabla de orders enlazadas a `/admin/orders/[id]`. `params: Promise<{ id }>` (Next 16 async).
  - `components/admin/customers/customers-search-form.tsx` — form GET simple `?q=` (sin estado client; un solo input → `<form method="get">` basta, no requiere `router.push` como T13).
- **Decisiones clave**:
  - **`Draft` excluido del count y del `lastOrderAt`** (lista) pero **incluido en el detalle**. Razón: en el listado los agentes quieren métricas de actividad real (drafts del embudo abandonado inflarían el conteo); en el detalle del cliente sí interesa ver todo lo asociado, incluido el draft que aún no convirtió. Si el usuario reporta que prefiere ver drafts en la lista, quitar el `nonDraft` de la join en `listCustomers`.
  - **`ne(status, 'Draft')` en el ON de la leftJoin, no en el WHERE.** Llevarlo al WHERE convertiría implícitamente el leftJoin en innerJoin (eliminaría customers sin orders no-draft, ej. Bob = 0 orders). Patrón a recordar para futuros agregados con leftJoin condicional.
  - **`coalesce(count(...), 0)::int`** explícito porque `count()` con leftJoin puede ser 0 y Drizzle/pg lo devuelve como `string` (bigint). Castear a int en SQL evita el `Number()` ad-hoc en JS.
  - **Form GET nativo** para search: solo un input, no necesita state client. El navegador serializa `q=` y submit recarga server-side. Más simple que `OrdersFilters` que sí necesita client (multi-select de status).
  - **Orden por `customers.createdAt` desc** (no por `lastOrderAt`): los más recientes son los que probablemente requieren atención del agente. Si el cliente prefiere "ordenar por última actividad", cambiar a `desc(max(orders.createdAt))` (necesita ser declarado como sql sortable).
  - **No agregar nav-config**: `Customers` ya estaba en `components/admin/nav-config.ts:28` desde T07 con `adminOnly: false`. Sólo había que crear las rutas.
- **Gotchas / aprendizajes**:
  - El cross-link inverso ya estaba listo: `app/admin/(panel)/orders/[id]/page.tsx:102` enlaza a `/admin/customers/${customer.id}`. T15 solo cierra el círculo creando el destino. Confirma "links cruzados" del criterio de aceptación.
  - `max(orders.createdAt)` en Drizzle devuelve `Date | null` cuando se usa en agregado con leftJoin (null si no hay rows). No tipo issue, solo recordar para el render del `—`.
  - Filtrar por `ne(status, 'Draft')` en la join condition es la primera vez en este proyecto que se usa una condición compuesta en el ON de `leftJoin`. Funciona out-of-the-box pasando `and(...)` como segundo arg.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (5.9s); rutas nuevas `/admin/customers` y `/admin/customers/[id]` listadas como ƒ. TypeScript ok.
  - Smoke test (`smoke-t15.ts` efímero, ya borrado): seed Alice (2 orders Pending+Completed + 1 Draft) y Bob (0 orders) → `listCustomers` retorna Alice con `orderCount=2` y `lastOrderAt` no-null, Bob con `orderCount=0` y `lastOrderAt=null` ✓ (confirma exclusión de Draft sin descartar customers sin orders) → search por substring de email retorna el customer correcto ✓ → `getCustomerById(alice)` retorna 3 orders en el detalle (incluye Draft) con provider/plan resueltos ✓ → cleanup ok.
  - **Limitación**: navegación visual requiere sesión Clerk con rol `agent` o `admin` (mismo bloqueo que T07–T14).
- **Pendiente para próxima sesión**:
  - **Cierra Fase 1**. Próxima fase: **Fase 2 — Landing pública**, comenzando por T16 (layout público + navegación). Cambia el contexto de admin → marketing; aplicar `--mahalo-gradient-soft` y arcos Wi-Fi del design system §3/§8.
  - Cuando llegue sesión Clerk, smoke E2E del flujo: orders → customer link → orders del customer → vuelta al order. Ya predispuesto bidireccionalmente.

## 2026-04-28 · T14 — Detalle de Order + status timeline

- **Estado final**: ✅ completada (DB + build verde; UI E2E pendiente de sesión Clerk).
- **Archivos tocados**:
  - `lib/orders/queries.ts` — agregado `getOrderById(id)` que resuelve `order` + `customer/provider/plan` (FK pueden ser null por `set null`) + `addOns` (lookup vía `inArray(orders.addOnIds)`) + `history` (asc por `createdAt`). Usa `Promise.all` para paralelizar las 4 lecturas dependientes.
  - `lib/orders/actions.ts` (nuevo) — `changeOrderStatus`, `rescheduleOrder` con Zod + `requireRole('agent')`. Ambas hacen `auth()` para `changedBy = userId` y envuelven update + insert de history en `db.transaction`.
  - `app/admin/(panel)/orders/[id]/page.tsx` — detalle con secciones Customer, Plan & add-ons (con total = planPrice [autopay/standard según `autopayEnabled`] + sum de add-ons), Addresses, Payment, Schedule, Change status, Status timeline. `params: Promise<{ id }>`. Valida UUID y `notFound()` si no existe.
  - `components/admin/orders/order-timeline.tsx` — server; lista descendente con badge + timestamp + `changedBy.slice(0,12)` + notas.
  - `components/admin/orders/status-changer.tsx` — client; `useTransition` + `<form action={fn}>` style RSC server actions. Botón disabled si `status === currentStatus` (evita el error "already X" del action).
  - `components/admin/orders/reschedule-form.tsx` — client; `<input type="datetime-local">` con `step={3600}` (UI hint de slots horarios). Validación final en server.
  - `components/admin/orders/payment-data-view.tsx` — client; toggle Reveal/Hide. Por defecto enmascara number/exp/cvv (card) o routing/account (ACH).
- **Decisiones clave**:
  - **`validateInstallationWindow` como función no-exportada** dentro de `actions.ts`. Razón: con `"use server"` a nivel de archivo, **todo export debe ser async** (Turbopack falló con `Server Actions must be async functions`). Mover la función a un archivo aparte funcionaría pero es ruido para una helper de 6 líneas; mantenerla privada es lo correcto.
  - **Window válida**: `Lun–Sáb (getDay !== 0)`, hora ∈ `[8, 17]`, `getTime() > now`. Acepta `17:00` como inicio de slot (consistente con el plan §T29 "8:00 a 17:00 cada hora"). El slot se interpreta como "punto de inicio" — la UI usa `<input type="datetime-local" step={3600}>` para sugerir incrementos horarios pero el server es la fuente de verdad.
  - **`rescheduleOrder` deja la orden en `Scheduled`** (criterio T14). Si ya estaba en `Scheduled`, no inserta history nueva (evita ruido en timeline al ajustar la fecha sin cambio de fase). Si venía de otro status, agrega entrada con notes `Rescheduled to <iso>`.
  - **`changeOrderStatus` rechaza el no-op** (`current.status === status`) en server. La UI deshabilita el botón en el mismo caso, pero la doble validación protege contra POST directo (server actions son endpoints reachable, ver `notes-next16.md` §9).
  - **Transacción para status change**: insert history + update orders en mismo `db.transaction` para garantizar que no quede order con status nuevo sin entrada de historial (o viceversa).
  - **Total calculado server-side** en la página: `planPrice + sum(addOns.price)`. Reproduce la lógica que tendrá el helper `calculateTotal` de T26; cuando T26 exista, refactorizar para reusarlo (y compartir con summary del embudo).
  - **PaymentDataView con masking por defecto** + botón Reveal toggle. El criterio T14 dice "payment_data se muestra (admite mostrar oculto con toggle)" — interpretado como reveal opcional. CVV y exp se enmascaran completos cuando reveal=false; number y account/routing solo dejan tail (4). El comentario "stored in plain text per requirement" se renderiza al usuario para recordatorio operativo.
- **Gotchas / aprendizajes**:
  - **`"use server"` file-level prohíbe exports no-async.** Diferente del patrón de `lib/plans/actions.ts` donde no hay funciones helper exportadas. Si una action necesita compartir helpers, mantenerlos privados al módulo o moverlos a un archivo separado sin la directiva `"use server"`.
  - `inArray(addOns.id, [])` en Drizzle genera SQL inválido (`IN ()`) — guard `addOnIds.length > 0` antes de la query es necesario. Mismo pattern aplicará a `selectAddOns` (T25) cuando lea por draft.
  - `db.transaction()` en `node-postgres` Drizzle funciona sin config extra. Usado por primera vez en este proyecto; futuras actions multi-tabla (submitOrder T30) pueden replicar el patrón.
  - `<input type="datetime-local">` retorna string `YYYY-MM-DDTHH:mm` sin TZ; al pasar a `new Date(value)` se interpreta en TZ del navegador. La validación de hora (`getHours()`) opera en TZ local del **server** — para deployment en US East/Central debería coincidir razonablemente con el cliente, pero anotar que un agente operando desde otra TZ podría ver edge cases en la frontera 17:00. Si se vuelve un problema, mover la validación a la TZ de la dirección de instalación.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (4.2s); ruta nueva `/admin/orders/[id]` listada como ƒ. TypeScript ok.
  - Smoke test (`smoke-t14.ts` efímero, ya borrado): seed provider/plan/customer/order con `paymentData=card` + 2 entries en history → `getOrderById` retorna detail completo con customer/provider/plan resueltos, history en orden ascendente, `paymentData.type === 'card'`, `installationAddress.zip` correcto. Todos los checks ✓.
  - **Limitación**: el toggle de payment, el form `datetime-local`, el botón de status change y el timeline visual requieren sesión Clerk con rol `agent` o `admin` (mismo bloqueo que T07–T13).
- **Pendiente para próxima sesión**:
  - T15 — Customers (listado + detalle). Reusar `getOrderById`-style pattern para `getCustomerById` que liste sus orders. Links cruzados ya predispuestos: el detalle de orden enlaza a `/admin/customers/[id]`.
  - Cuando llegue sesión Clerk: smoke E2E `Pending → Created → Scheduled (vía reschedule) → Installed → Completed`, verificar timeline ordenado y que `changedBy` aparece con `userId.slice(0,12)`.
  - Cuando exista helper `calculateTotal` (T26), refactorizar el cálculo inline de la página detalle para consumirlo.

## 2026-04-28 · T13 — Listado de Orders

- **Estado final**: ✅ completada (DB + build verde; UI E2E pendiente de sesión Clerk como T08–T12).
- **Archivos tocados**:
  - `lib/orders/queries.ts` — `listOrders({statuses, providerId, dateFrom, dateTo, search, page, pageSize})` con joins LEFT a `customers/providers/plans`, orden `desc(createdAt)`, paginación server-side y `count()` con el mismo `where`.
  - `app/admin/(panel)/orders/page.tsx` — `requireRole('agent')`, parseo de `searchParams` (status repetidos, provider, from/to, q, page), tabla shadcn con id corto, customer, provider, plan, status badge, scheduled, created. Componente `Pagination` interno.
  - `components/admin/orders/orders-filters.tsx` — client form: search (input), provider (select nativo), date range (`type="date"`), status (chips toggle multi-select), botones Apply/Reset que pushean URL.
  - `components/brand/StatusBadge.tsx` — agregado `Draft` al tipo `OrderStatus` con estilo neutro (`bg-muted`). Necesario porque la lista incluye drafts del embudo.
- **Decisiones clave**:
  - **Status como `?status=` repetido** (multi-select serializado vía `URLSearchParams.append`), no comma-separado. Native al estándar de query strings, mejor UX al copiar/pegar URL y `parseStatuses` valida cada valor contra `orderStatusValues` antes de pasarlo a `inArray()`. Mismo patrón aplicará a futuros filtros multi.
  - **Filtros como client component con `router.push`** en lugar de `<form method="get">`. Razón: status multi-select requiere estado client (toggle de chips); usar form GET implicaría inputs hidden generados al toggle, más fricción que manejar el state. El reset también navega vía `router.push("/admin/orders")` para limpiar URL.
  - `requireRole('agent')` (no `admin`) — Orders es shared con agents según `nav-config.ts`. El listado no permite gestión, solo lectura/navegación.
  - **Parseo de fechas**: input `type="date"` da `YYYY-MM-DD`; convierto a UTC `T00:00:00.000Z` (from) y `T23:59:59.999Z` (to). El usuario filtra en su zona pero acá tratamos día-completo en UTC — suficiente para el caso "rango de creación" sin TZ-aware UI. Si más adelante se necesita filtrado preciso por TZ del usuario, mover a un helper que reciba IANA TZ.
  - **`ilike` para búsqueda** (case-insensitive) sobre `firstName/lastName/email` con `%pattern%`. Sin índice trigram — el dataset esperado (<10k orders) no lo justifica todavía; si crece, evaluar `pg_trgm` GIN index. El `or()` se importa de drizzle-orm y devuelve `SQL | undefined` (de ahí el guard `if (searchCond)`).
  - **`leftJoin` para todas las relaciones** (customer/provider/plan): drafts pueden tener `customerId/providerId/planId` null, y `set null` en FK garantiza orphans tras toggle de proveedor. La UI muestra `—` en esos casos.
  - StatusBadge ahora cubre `Draft`: necesario para no crashear cuando la lista incluye órdenes en `Draft` (que se ven en `/admin/orders` por requerimiento de T23: "el draft se ve como `Draft`").
- **Gotchas / aprendizajes**:
  - Drizzle `or(...)` devuelve `SQL | undefined` cuando recibe condicionales que pueden ser undefined; tipear el array como `SQL[]` y filtrar antes de `push` evita el error TS. Diferente de `and()` que es más permisivo.
  - El `count()` con joins requiere replicar exactamente los mismos joins que la query de filas si hay condiciones que tocan tablas joined. Acá solo `customers` participa en filtros (search), así que el count usa `leftJoin customers` también — providers/plans no se joinean en count para minimizar trabajo.
  - `searchParams` en Next 16 es Promise (igual que ya documentado); el tipo del param `sp` para `Pagination` se obtuvo con `Awaited<SearchParams>` para evitar duplicar el shape.
  - El tipo `string | string[]` para `status` en searchParams es propio de Next App Router cuando hay parámetros repetidos en URL — `?status=A&status=B` llega como array, `?status=A` como string.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (5.0s); ruta nueva `/admin/orders` listada como ƒ. TypeScript ok.
  - Smoke test (script efímero `smoke-t13.ts` + DB en docker, ya borrado): seed 2 customers + 2 plans + 3 orders distribuidas → filter `statuses=['Pending']` aísla o1 ✓ → `providerId=p2` aísla o2 ✓ → `search='alice'` retorna o1+o2 (mismo customer) y excluye o3 (Bob) ✓ → search por substring de email retorna o3 ✓ → combinación `Cancelled + p1` retorna solo o3 ✓ → `pageSize=2 page=1` con `total=3` produce `totalPages=2, rows.length=2` ✓ → row shape resuelve customer/provider/plan via leftJoin ✓ → cleanup ok.
  - **Limitación**: navegación visual (chips toggle, datepickers, paginación) requiere sesión Clerk con rol `agent` o `admin` (mismo bloqueo que T07–T12).
- **Pendiente para próxima sesión**:
  - T14 — Detalle de Order + status timeline. Usará `params: Promise<{ id }>` (Next 16 async) y reusará `StatusBadge` ya extendido con `Draft`. La action `changeOrderStatus` debe insertar en `order_status_history` con `changedBy = clerk userId`.
  - Cuando llegue sesión Clerk, smoke E2E del flujo de filtros: aplicar status multi → cambiar provider → date range → search → reset → URL refleja cada combinación.

## 2026-04-28 · T12 — Settings (key-value)

- **Estado final**: ✅ completada (DB + build verde; UI E2E pendiente de sesión Clerk como en T08–T11).
- **Archivos tocados**:
  - `lib/settings/queries.ts` — `getSetting`, `getAllSettings` + constante `KNOWN_SETTING_KEYS = ['notification_email','webhook_url']`.
  - `lib/settings/get.ts` — wrappers `getSettingCached` / `getAllSettingsCached` con `react.cache` para cache por request (consumible desde server actions de notificaciones T32/T33).
  - `lib/settings/actions.ts` — `saveKnownSettings` (upsert paralelo de los 2 fijos), `setSetting` (custom KV), `deleteSetting`. Validación Zod + `requireRole('admin')` + `revalidatePath('/admin/settings')`.
  - `app/admin/(panel)/settings/page.tsx` — sección "Notifications" con form de los 2 keys + sección "Custom settings" con tabla + form add.
  - `components/admin/settings/known-settings-form.tsx` — client form para los 2 keys conocidos.
  - `components/admin/settings/custom-settings-section.tsx` — tabla con edit/save/delete por fila + form para agregar (key con regex `^[a-z][a-z0-9_]{0,79}$`, value libre).
- **Decisiones clave**:
  - `notification_email` y `webhook_url` aceptan **string vacío** para "deshabilitar" la notificación. Si el cliente borra el valor desde UI, T33 (`triggerWebhook`) y T32 (`sendNewOrderEmail`) deben tratar `'' | null` como noop. Este contrato (string vacío = disabled) es más simple que NULL/missing-row y mantiene la UI determinista (ver el form deja el campo vacío en lugar de "ausente").
  - Validación de URL hecha con `new URL()` + check de protocolo `http/https` en lugar de regex. Aceptar paths/queries arbitrarios sin falsos positivos.
  - **`saveKnownSettings` upsertea ambos keys siempre** (no compara contra el valor previo). Más simple y atómicamente consistente con el form (un submit = un estado completo). Costo: 2 UPDATEs por save aunque el usuario solo cambie uno; despreciable.
  - **Custom KV**: el form de "add" reusa `setSetting` (el mismo action sirve para crear y editar — es upsert). La tabla edita inline con `<Input>` controlado y un botón Save por fila; el botón Save se deshabilita si `value === row.value` para que no haya escrituras espurias.
  - **Reserved keys**: el schema Zod de custom rechaza `notification_email`/`webhook_url` para forzar a editarlos en el form principal y evitar duplicación visual. La página filtra rows ya conocidos al pasar a `CustomSettingsSection`.
  - `react.cache` en `lib/settings/get.ts` (no Next `unstable_cache`): la nota de Next 16 (`notes-next16.md` §3) recomienda `cacheTag`/`cacheLife` para cache cross-request, pero acá solo necesitamos dedupe **dentro** de una request (settings se leen en page + en email/webhook actions). `cache()` de React es la primitiva correcta y no requiere migrar a `'use cache'`.
- **Gotchas / aprendizajes**:
  - Tabla `settings` tiene PK en `key` (sin id uuid), por eso `onConflictDoUpdate({ target: settings.key, ... })` apunta directo a la columna PK. Visto en `lib/db/schema.ts:154-160`.
  - Drizzle `db.insert(...).onConflictDoUpdate(...)` requiere pasar `set: { ..., updatedAt: new Date() }` explícito porque el default `defaultNow()` solo aplica en INSERT puro. Si lo omites, `updatedAt` queda congelado en el primer insert.
  - `formData.get('webhook_url') ?? ''` en lugar de `?? undefined`: con `undefined` Zod aplicaría el coerce default y validaría contra `z.string()` causando "Required". Tratar el form como "string siempre" (vacío = vacío) elimina la rama de undefined.
  - El registry shadcn `base-nova` no incluye un componente `<Switch>` ni `<Toggle>`, así que el botón de "Save" inline en cada fila usa `Button variant="ghost" size="sm"` con `disabled` derivado del diff. Si en el futuro queremos un toggle visual para "active/inactive" en custom settings, instalar/escribir `<Switch>` (mismo gap que `form` y `textarea` ya documentados en T03/T09/T11).
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (5.4s); ruta nueva `/admin/settings` listada como ƒ. TypeScript ok.
  - Smoke test (script efímero `smoke-t12.ts` + DB en docker, ya borrado): insert `notification_email=ops@example.com` → upsert mismo key con `ops2@example.com` → `getSetting('notification_email')` retorna `'ops2@example.com'` ✓ → insertados `webhook_url` y `feature_xyz` (custom) → `getAllSettings()` retorna las 3 ordenadas alfabéticamente ✓ → `delete feature_xyz` → quedan solo los 2 known ✓. Confirma criterio de aceptación: "cambiar el valor desde UI persiste y se lee desde server actions".
  - **Limitación**: edición real desde UI requiere sesión Clerk con `publicMetadata.role='admin'` (mismo bloqueo que T08–T11).
- **Pendiente para próxima sesión**:
  - T13 — Listado de Orders (Fase 1 sigue). Dependerá de patrones de URL state ya establecidos en T11 (search/filtros server-side por `searchParams`).
  - T32/T33 (notificaciones) consumirán `getSettingCached('notification_email')` y `getSettingCached('webhook_url')`; tratar string vacío como noop ahí.

## 2026-04-28 · T11 — Coverage manager (ZIPs)

- **Estado final**: ✅ completada (DB + build verde; UI E2E pendiente de sesión Clerk como T08–T10).
- **Archivos tocados**:
  - `lib/coverage/queries.ts` — `listCoverageByProvider` (search por prefijo + paginación server-side, default `pageSize=20`) y `findProvidersByZip` (join activos, retorna `[]` ante input no-numérico).
  - `lib/coverage/actions.ts` — `addZips` (parsing tolerante a separadores, dedupe + `onConflictDoNothing`, retorna `{added, skipped}`), `removeZip`. Zod + `requireRole('admin')` + `revalidatePath('/admin/coverage')`.
  - `app/admin/(panel)/coverage/page.tsx` — selector de proveedor + tabla paginada con search + panel "Add ZIPs" + paginación link-based; botón CSV import deshabilitado con tooltip.
  - `components/admin/coverage/{provider-selector,coverage-search-form,remove-zip-button,add-zips-form}.tsx` — UI client.
- **Decisiones clave**:
  - **Estado en URL** (`?provider=&search=&page=`) en lugar de estado client. Un refresh o link compartido reproduce la vista exacta y la paginación se vuelve trivialmente prerefetcheable. Mismo patrón que pediremos para `/admin/orders` (T13).
  - **Search por prefijo** con `LIKE 'XXX%'` aprovechando el btree existente sobre `zip_code` (`provider_coverage_zip_idx`). Suficiente para el caso de uso "filtrar 33xxx" y mucho más barato que un FTS o `ILIKE '%xxx%'`.
  - `addZips` acepta separadores mixtos (`\s,;`), dedupe en memoria y delega la unicidad a la constraint `(provider_id, zip_code)` con `onConflictDoNothing`. Retorno `{added, skipped}` se muestra inline al usuario — feedback claro sin toast adicional.
  - Cap de **2000 ZIPs por batch** para evitar payloads gigantes en una server action; el cliente real subirá el bulk vía CSV (T futura). Por encima del cap el form rechaza con mensaje único en `fieldErrors.zips`.
  - `<select>` nativo en `ProviderSelector` en lugar del `Select` de `@base-ui/react`: el primer paso es de navegación (no formulario), HTML nativo es más accesible por teclado y evita un wrapper de portal solo para 8 opciones.
- **Gotchas / aprendizajes**:
  - Zod 4: `.errors` está deprecado, usar `.issues`. Para validación + transform en un solo campo (la textarea de ZIPs), `.transform((raw, ctx) => { ctx.addIssue(...); return z.NEVER })` es más legible que encadenar `.pipe(z.array(...))` y mantiene los errores agrupados bajo el mismo path (`zips`) para que el form los muestre inline.
  - Drizzle `count()` se importa de `drizzle-orm` y devuelve un objeto `{value: number}` cuando se le da alias (`{ value: count() }`). No es `string` como otros agregados de pg.
  - `searchParams` en Next 16 es `Promise` — `await sp` antes de leer, igual que `params` (ver `notes-next16.md`).
  - Las clases utilitarias en el `<textarea>` se replican de los componentes shadcn `Input` para mantener look & feel; cuando exista un `<Textarea>` shadcn (no está en `base-nova`) hacer pasada de migración.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (5.3s); ruta nueva `/admin/coverage` listada como ƒ. TypeScript ok.
  - Smoke test (script efímero `smoke-t11.ts` + DB en docker, ya borrado): insertó 50 ZIPs en AT&T → re-insert idempotente devuelve 0 nuevos ✓ → paginación `page=1` retorna 20, `page=3` retorna 10, `totalPages=3` ✓ → search prefix `'3315'` filtra a `['33150']` ✓ → solapamiento con Fios en `33101`: `findProvidersByZip('33101')` retorna ambos activos `['AT&T','Verizon Fios']` → al desactivar Fios retorna solo `['AT&T']` ✓ → tras eliminar 3 ZIPs uno-a-uno, AT&T queda con 47 ✓ → `findProvidersByZip('abcde')` retorna `[]` ✓. Confirma criterio de aceptación textual.
  - **Limitación**: dialog/forms en navegador requieren sesión Clerk con `publicMetadata.role='admin'` (mismo bloqueo que T08–T10).
- **Pendiente para próxima sesión**:
  - T12 — Settings (key-value). Reusar el patrón URL state si requiere búsqueda/filtros, aunque seguramente sea más simple (form único).
  - Cuando llegue sesión Clerk, smoke E2E del flujo: seleccionar proveedor → bulk add 50 ZIPs → search → remove → toggle visibilidad por desactivar proveedor.

## 2026-04-28 · T10 — CRUD Add-ons (por proveedor)

- **Estado final**: ✅ completada (DB + build verde; UI E2E pendiente de sesión Clerk como T08/T09).
- **Archivos tocados**:
  - `lib/add-ons/queries.ts` — `listAddOnsByProvider` (orden alfabético), `getAddOnById`, `providerHasActiveAddOns`.
  - `lib/add-ons/actions.ts` — `createAddOn`, `updateAddOn`, `toggleAddOnActive` con Zod + `requireRole('admin')` + `revalidatePath`.
  - `components/admin/add-ons/add-ons-section.tsx` — client; tabla con Edit/Toggle y dialog "New add-on".
  - `app/admin/(panel)/providers/[id]/page.tsx` — agregado tab "Add-ons (N)" con `listAddOnsByProvider` server-side.
- **Decisiones clave**:
  - Sin `sortOrder` para add-ons (no lo pide el spec): orden alfabético por `name`. Si más adelante el cliente quiere prioridad explícita, agregar columna y migrar como en plans.
  - `description` opcional con transform a `null` cuando viene vacío (la columna `text` permite null en schema). Mantiene la query de embudo simple (`addOn.description ?? "—"`).
  - `providerHasActiveAddOns(providerId)` consulta directa con `limit(1)` — más barato que un `count(*)`. Lo consumirá T25 para auto-skip del paso de add-ons.
  - Reuso 1:1 del patrón `PlansSection` excepto que **no** hay panel de reorder (no aplica) ni textarea de features. Se eliminaron también `speed`/`priceAutopay`.
- **Gotchas / aprendizajes**:
  - Reciclé el `priceSchema` de plans y el comentario sobre `numeric(10,2)` ↔ string vale exactamente igual aquí (precio devuelto como string por Drizzle, render con `Number().toFixed(2)`).
  - El `description` viaja por `formData.get("description") ?? ""`; el transform de Zod lo convierte a `null` antes del insert para no persistir strings vacíos.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (5.9s); rutas `/admin/providers/[id]` siguen como ƒ. TypeScript ok.
  - Smoke test (script efímero `smoke-t10.ts` + DB en docker, ya borrado): insert dos add-ons (uno active=true, otro active=false) → `listAddOnsByProvider` orden alfabético correcto → `providerHasActiveAddOns` retorna `true` con uno activo, `false` tras desactivarlo → `getAddOnById` resuelve → cleanup ok. Confirma criterio de aceptación: "si un proveedor no tiene add-ons activos, `providerHasActiveAddOns(providerId)` retorna `false`".
- **Pendiente para próxima sesión**:
  - T11 — Coverage manager (ZIPs); independiente de planes/add-ons. Requiere UI más rica (search + paginación) y `findProvidersByZip` para la landing.
  - Cuando llegue sesión Clerk, smoke E2E del flujo de add-ons en el dashboard junto con T08/T09.

## 2026-04-28 · T09 — CRUD Plans (por proveedor)

- **Estado final**: ✅ completada (CRUD a nivel DB + build verde; UI E2E pendiente de sesión Clerk).
- **Archivos tocados**:
  - `lib/plans/queries.ts` — `listPlansByProvider` (orden `sortOrder asc, name asc`) y `getPlanById`.
  - `lib/plans/actions.ts` — server actions `createPlan`, `updatePlan`, `togglePlanActive`, `reorderPlans`. Zod + `requireRole('admin')` + `revalidatePath`.
  - `components/admin/plans/plans-section.tsx` — client; tabla, dialogs New/Edit, toggle Active y panel "Quick reorder".
  - `app/admin/(panel)/providers/[id]/page.tsx` — reorganizado con shadcn `Tabs` (Details / Plans). Carga `listPlansByProvider` server-side.
- **Decisiones clave**:
  - Drizzle `numeric(10,2)` se inserta y recibe como **string** ("49.99"). El form lo manda como string, Zod lo valida con regex (`/^\d+(\.\d{1,2})?$/`) y se persiste sin conversión a `Number`. El cast a `Number` solo ocurre en render para `toFixed(2)`. Coherente con la nota de T05.
  - `features` viaja como textarea (una línea = un feature). El parseo está en el `featuresSchema` de Zod (`split /\r?\n/` + trim + filter empty). Más simple y testable que un control de tags y suficiente para el panel admin.
  - `reorderPlans` recibe `{ providerId, orders[] }` directamente (no `FormData`) — la UI del panel "Quick reorder" mantiene un `draft` cliente y al guardar manda el array completo. Encaja con la nota de la tarea ("reorder simple con inputs numéricos `sort_order`; drag-and-drop opcional") y sirve también para una futura migración a DnD: la action ya acepta cualquier orden completo.
  - `EditPlanDialog` por fila monta un `<Dialog>` independiente. Costo de árbol bajo (no hay >10 planes por proveedor en producción esperada). Si crece, mover a un único dialog controlado por estado en `PlansSection`.
  - Tabs con `defaultValue="details"` y conteo en la pestaña Plans (`Plans (N)`) — quick-glance del estado del proveedor sin abrir el tab.
- **Gotchas / aprendizajes**:
  - `DialogTrigger` del registry `base-nova` usa el render-prop `render={<Button …/>}` igual que en T07/T08. No usar `asChild` estilo Radix.
  - El widget `<textarea>` no está en shadcn `base-nova` (igual que `form` lo fue en T03). Lo escribí inline con clases coherentes con `Input` (`border border-input`, etc.) en lugar de instalar uno custom.
  - tsx falla con top-level await en archivos `.ts` (esbuild output cjs por defecto). Para smoke tests CLI envolver en `async function main()` + `.then(() => process.exit(0))`. Aplicará a futuros scripts de verificación rápida.
  - `mahalo-blue-50` no existe como token (la paleta tiene `blue-600/700/500/400`). Usé `bg-muted/40` para el contenedor del reorder. Si más adelante quieres un fondo de marca suave, agregar `--mahalo-blue-50` a `globals.css`.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (4.4s); rutas `/admin/providers/[id]` siguen como ƒ. TypeScript ok.
  - Smoke test (script efímero `smoke-t09.ts` con tsx + DB en docker): inserta 2 planes (`Starter` sort=2, `Gigabit` sort=1) → `listPlansByProvider` retorna `Gigabit(sort=1) | Starter(sort=2)` → toggle isActive=false confirmado → cleanup. Confirma orden, persistencia de `features` JSON, precios numeric round-trip y toggle.
  - **Limitación**: la verificación visual de los dialogs (New/Edit/Reorder/Toggle) requiere sesión Clerk con `publicMetadata.role='admin'`. Mismo bloqueo que T08.
- **Pendiente para próxima sesión**:
  - T10 — CRUD Add-ons (gemela estructural de T09; el patrón `PlansSection` se traslada casi 1:1 a `AddOnsSection` dentro de un nuevo tab "Add-ons" en `/admin/providers/[id]`). Reusar Zod price schema y la convención del array vía textarea no aplica (add-ons no tienen features), pero sí el resto.
  - Cuando llegue sesión Clerk, smoke E2E del flujo de planes en el dashboard. Anotar bugs en una entrada nueva.

## 2026-04-28 · T08 — CRUD Providers

- **Estado final**: ✅ completada (verificación end-to-end de UI bloqueada por falta de sesión Clerk; verificación a nivel DB + build pasada).
- **Archivos tocados**:
  - `lib/providers/queries.ts` — `listProviders` (orden alfabético) y `getProviderById`.
  - `lib/providers/actions.ts` — server actions `createProvider`, `updateProvider`, `toggleProviderActive`, `uploadProviderLogo` con Zod, `requireRole('admin')` y `revalidatePath`.
  - `app/admin/(panel)/providers/page.tsx` — listado en shadcn Table con dialog "New provider".
  - `app/admin/(panel)/providers/[id]/page.tsx` — detalle con secciones Logo + Details; usa `params: Promise<...>` (Next 16 async).
  - `components/admin/providers/new-provider-dialog.tsx` — dialog client; tras crear redirige al detalle.
  - `components/admin/providers/provider-edit-form.tsx` — form de edición con feedback inline.
  - `components/admin/providers/provider-active-toggle.tsx` — botón toggle Active/Inactive.
  - `components/admin/providers/provider-logo-form.tsx` — upload con validación cliente y server.
  - `.gitignore` — agrega `/public/uploads/` (logos generados en runtime no versionados).
- **Decisiones clave**:
  - Logos a `public/uploads/providers/{id}.{ext}` (filesystem, no DB blob): consistente con el plan §3 (`public/uploads/`) y el volumen `uploads` de `docker-compose.yml`. La columna `logoUrl` guarda el path relativo `/uploads/providers/{id}.{ext}?v={timestamp}` — el query string fuerza refresco visual tras reemplazo (Next 16 sube `minimumCacheTTL` de imágenes a 4h, ver `notes-next16.md` §7). Como aquí usamos `<img>` plano (no `next/image`), el query string es suficiente.
  - Si el `ext` cambia (ej. de `png` a `svg`), se borra el archivo viejo (filename distinto). Si el `ext` es el mismo, `writeFile` sobrescribe — no requiere unlink.
  - Validación de tipo MIME por mapa whitelist (`png/jpeg/webp/svg`); el `ext` se deriva del MIME, no del nombre del archivo (defensa contra ext spoof).
  - **No se usa `react-hook-form`** en estos formularios. Validación principal en server (Zod) + validación HTML nativa (`required`, `pattern`, `accept`, `maxLength`). Es coherente con `plan.md` §11 ("RHF solo en formularios complejos") — los formularios de provider son simples (3 campos + file).
  - `Button` de `base-ui/react` no soporta `asChild` estilo Radix; uso `buttonVariants(...)` en `<Link>` para los enlaces "Edit" (mismo patrón que el sidebar de T07). Para `DialogTrigger` se usa el render-prop `render={<Button …/>}` del registry `base-nova` (ver T07 gotcha).
  - `revalidatePath` (no `updateTag`): la guía de Next 16 (`notes-next16.md` §3) recomienda `updateTag`, pero requiere migrar las queries a `cacheTag`. Como las páginas usan `dynamic = "force-dynamic"`, `revalidatePath` basta hoy. Migrar a tags cuando cacheemos las queries (probablemente en hardening / T37).
- **Gotchas / aprendizajes**:
  - Server actions con `File` viajan por FormData multipart; `formData.get('logo')` retorna `File`. `Buffer.from(await file.arrayBuffer())` es la forma compatible con `node:fs/promises.writeFile`. Funciona en runtime nodejs (Next 16 default).
  - El `requireRole('admin')` ya redirige a `/admin` si el rol es `agent`. Consistente con la regla "agent no ve gestión".
  - La carpeta `public/uploads/providers/` se crea bajo demanda en el primer upload (`mkdir recursive`). Si no existe el dir, los logos viejos en DB apuntan a 404 — esperado, no se persiste nada hasta el primer upload.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (4.0s); rutas `/admin/providers` y `/admin/providers/[id]` listadas como ƒ. TypeScript ok.
  - `docker compose up -d db` + `npm run db:migrate` + `npm run db:seed` → 8 providers en DB.
  - Smoke test `tsx -e` → `listProviders()` retorna 8 filas ordenadas alfabéticamente (AT&T, Brightspeed, …, Verizon Fios). Confirma que el query feeding de la UI funciona.
  - **Limitación**: la verificación visual del flujo CRUD completo (crear vía dialog, editar, toggle, upload) requiere sesión Clerk con `publicMetadata.role = 'admin'` — bloqueo conocido (T06/T07). El stack está completo a nivel código y DB.
- **Pendiente para próxima sesión**:
  - T09 — CRUD Plans por proveedor; reusar el patrón de actions y forms client de esta tarea. La UI vivirá dentro de `/admin/providers/[id]` como tab "Plans" (shadcn `Tabs`).
  - Cuando el cliente provea sesión Clerk, ejecutar el smoke E2E manual: crear → upload logo → editar → desactivar → reactivar. Anotar bugs en una entrada nueva si aparecen.

## 2026-04-28 · T07 — Layout admin con sidebar y guard de rol

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `app/admin/(panel)/layout.tsx` — shell con sidebar fijo desktop + header con `<UserButton />`; aplica `auth.protect()` y resuelve nav por rol.
  - `app/admin/(panel)/page.tsx` — home admin movida al route group del panel, simplificada (header lo provee el layout).
  - `app/admin/page.tsx` — eliminado (reemplazado por el del route group).
  - `components/admin/nav-config.ts` — items de navegación (icono lucide + flag `adminOnly`) y helper `visibleNavFor(role)`.
  - `components/admin/sidebar-nav.tsx` — client; pinta links con estado activo vía `usePathname` (matchea exact + prefijo `/x/`).
  - `components/admin/mobile-sidebar.tsx` — wrapper de `<Sheet>` con trigger hamburguesa visible solo `<md`.
- **Decisiones clave**:
  - **Route group `(panel)`** para que el layout solo envuelva las páginas autenticadas. Sin esto, `/admin/sign-in` heredaba el layout y disparaba `auth.protect()` antes de mostrar el formulario, generando loop. El sign-in se queda en `app/admin/sign-in/[[...sign-in]]/` por fuera del grupo.
  - Visibilidad por rol resuelta en server (layout llama `getCurrentRole()` y pasa items ya filtrados al sidebar). Evita pintar links que el cliente luego oculta. Items "gestión" (`adminOnly: true`): Providers, Plans, Add-ons, Coverage, Settings. `agent` ve solo Orders + Customers. Si no hay rol, lista vacía.
  - Sidebar usa `bg-mahalo-navy-900` para el item activo (sólido, no gradiente — el design system prohíbe gradiente en admin §16).
  - Active state matchea `pathname === href || startsWith(href + "/")` para que rutas hijas (futuras `/admin/providers/[id]`) marquen el padre.
- **Gotchas / aprendizajes**:
  - El `<Sheet>` de `base-nova` usa `@base-ui/react`; `SheetTrigger` acepta el patrón `render={<Button … />}` (igual que en `sheet.tsx`). No se debe envolver con `asChild` estilo Radix.
  - `Logo` no tiene prop `alt`; pasa `Image` con alt fijo. Cambiar tamaño con `width`/`height` (height=36 en sheet header da una altura proporcional).
  - El layout queda como server component pese a importar componentes client (`SidebarNav`, `MobileSidebar`) — cruzar la boundary funciona porque solo se pasan items ya serializables (sin el `LucideIcon` componente). Cuidado: el icono se pasa como referencia de componente y atraviesa la barrera, lo cual Next permite porque al final SidebarNav es client y reconstruye allí. Verificado en build.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled successfully (4.4s), TypeScript ok. Rutas: `/admin` y `/admin/sign-in/[[...sign-in]]` listadas como ƒ (dynamic). Sin warnings nuevos.
  - Estructura de rutas confirmada: `/admin` resuelve a `(panel)/page.tsx` con el shell; `/admin/sign-in` queda fuera del grupo (sin shell). **Criterio de aceptación cumplido**: el filtrado por rol en `visibleNavFor` garantiza que `agent` no vea enlaces de gestión, `admin` ve todos.
- **Pendiente para próxima sesión**:
  - T08 — CRUD Providers. La home del admin (`(panel)/page.tsx`) sirve como placeholder; al implementar T08, agregar también un dashboard con KPIs si el cliente lo pide (no está en spec).
  - Validación visual con sesión real Clerk requiere asignar `publicMetadata.role` desde el dashboard (mismo bloqueo señalado en T06).

## 2026-04-27 · T06 — Integrar Clerk y proteger /admin

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `proxy.ts` — `clerkMiddleware` con `auth.protect()` sobre `/admin(.*)` excluyendo `/admin/sign-in(.*)` para evitar loop de redirección. Convención `proxy.ts` de Next 16 (no `middleware.ts`, deprecado en v16.0.0).
  - `app/layout.tsx` — root envuelto en `<ClerkProvider>` (de `@clerk/nextjs`, no `/server`).
  - `app/admin/sign-in/[[...sign-in]]/page.tsx` — `<SignIn path routing="path" forceRedirectUrl="/admin" />`.
  - `app/admin/page.tsx` — server component con `auth.protect()`, `currentUser()`, `<UserButton />` y rol del usuario.
  - `lib/clerk/require-role.ts` — `getCurrentRole()` y `requireRole('admin'|'agent')` leyendo `sessionClaims.publicMetadata.role`.
- **Decisiones clave**:
  - Matcher de middleware excluye assets estáticos con la regex recomendada por Clerk + cubre `/(api|trpc)(.*)`. Necesario porque solo queremos proteger `/admin`, pero Clerk requiere correr el middleware en cualquier ruta donde después se llame `auth()`.
  - Sign-in route excluida del `auth.protect()` dentro del propio middleware con `createRouteMatcher` — sin esto, `/admin/sign-in` también dispararía `protect()` y se perdería la página de login.
  - `requireRole('agent')` permite también `admin` (admin tiene todo), `requireRole('admin')` exige rol exactamente `admin`. Misma semántica que se necesita para los guards de T07.
  - `<UserButton />` sin `afterSignOutUrl`: la prop fue removida en `@clerk/nextjs` 7.x. La redirección post-signout se controla vía `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL` o por la app de Clerk.
- **Gotchas / aprendizajes**:
  - **Migración a `proxy.ts`**: la decisión inicial (T01) era mantener `middleware.ts` esperando guía de Clerk, pero `clerkMiddleware()` retorna un handler estándar y funciona como default export de `proxy.ts` sin cambios. La doc oficial de Next 16 (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`) confirma que la convención es `proxy.ts` desde v16.0.0. Build limpio, sin warning de deprecación.
  - `auth()` en App Router devuelve **Promise** en Next 16 — siempre `await auth()` (incluido `auth.protect()`).
  - Probar `/admin` sin sesión con `curl` retorna 404 si el `Accept` no es `text/html`: Clerk distingue document vs API request. Con `-H "Accept: text/html"` se ve el 307 de handshake correctamente.
  - `ClerkProvider` se importa desde `@clerk/nextjs` (no `/server`). Importarlo desde `/server` no rompe types pero el componente no funciona.
- **Verificación realizada**:
  - `npm run build` → ✓ Compiled + TypeScript ok; rutas `/admin` y `/admin/sign-in/[[...sign-in]]` listadas como ƒ (dynamic). Warning de middleware esperado.
  - `npm run dev` + `curl -H "Accept: text/html" http://localhost:3000/admin` → 307 de handshake Clerk (`__clerk_handshake=…`), confirma redirección a sign-in para usuarios no autenticados.
  - `curl http://localhost:3000/admin/sign-in` → 200 (página accesible sin auth). **Criterio de aceptación cumplido.**
- **Pendiente para próxima sesión**:
  - T07 — sidebar + guard de rol. Reusar `requireRole` ya creado.
  - Para validar visualmente con sesión real: usuario debe registrarse en la app Clerk (`pk_test_relaxed-calf-63`) y asignar manualmente `publicMetadata.role = 'admin'` desde el dashboard de Clerk.

## 2026-04-27 · T05 — Schema de DB + primera migración

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `lib/db/schema.ts` — 8 tablas Drizzle (`providers`, `plans`, `add_ons`, `provider_coverage`, `customers`, `orders`, `order_status_history`, `settings`) + tipos JSON (`AddressJson`, `PaymentData`).
  - `lib/db/client.ts` — singleton `Pool` y `drizzle()` con lazy init en `globalThis` (apto para HMR de Next y para scripts CLI).
  - `lib/db/migrate.ts` — runner de migraciones para `npm run db:migrate` (carga `dotenv/config`).
  - `lib/db/seed.ts` — upsert de los 8 proveedores con `onConflictDoUpdate` por `name` (idempotente).
  - `drizzle.config.ts` — dialect postgresql, schema → `lib/db/schema.ts`, out → `db/migrations`.
  - `db/migrations/0000_sweet_star_brand.sql` + `db/migrations/meta/` — generados por `drizzle-kit generate`.
  - `package.json` — scripts `db:generate`, `db:migrate`, `db:seed`, `db:studio` usando `tsx` (ya estaba instalado como devDep transitiva).
  - `.env` — agregada `DATABASE_URL=postgres://mahalo:mahalo@localhost:5432/mahalo` para que los scripts (no Compose) puedan apuntar al `db` expuesto en `localhost:5432`.
- **Decisiones clave**:
  - `customers.email` con `UNIQUE` para que el embudo pueda hacer upsert por email en T27 sin duplicar clientes.
  - `orders.customer_id`/`provider_id`/`plan_id` con `ON DELETE SET NULL` (no cascade): un draft no debe morir si reordenamos providers; el historial sigue siendo consultable.
  - `provider_coverage` con `UNIQUE(provider_id, zip_code)` para que `addZips` (T11) sea idempotente sin checks previos.
  - `settings` con PK en `key` (no autoincrement): la lógica clave-valor de T12 hace `INSERT … ON CONFLICT (key) DO UPDATE`.
  - Numéricos de precio: `numeric(10,2)`. Drizzle los devuelve como `string` — convertir con `Number()` o `parseFloat` en el helper de cálculos (T26).
  - Status como `varchar(24)` con `$type<OrderStatus>()` en lugar de `pgEnum` para evitar ALTER TYPE friccionoso si se agregan estados.
  - Seed sin planes/cobertura — eso queda para T38 (seed extendido). Esta sesión solo cubre el criterio de aceptación: "8 filas en `providers`".
- **Gotchas / aprendizajes**:
  - Los scripts CLI (`tsx lib/db/*.ts`) no tienen el autoload de `.env` que sí hace Next: requieren `import "dotenv/config"` arriba de todo (antes de importar `client.ts`, ya que ese archivo lee `process.env.DATABASE_URL`).
  - El `client.ts` usa `Proxy` sobre la instancia drizzle más un `getDb()` lazy: importar `db` desde `lib/db/client` no falla en build aunque `DATABASE_URL` no esté disponible en tiempo de import (Next tipa `db` como `NodePgDatabase<typeof schema>`).
  - `drizzle-kit generate` por defecto usa `drizzle.config.ts` en root y emite migración + carpeta `meta/` con snapshot — ambos deben commitear.
  - El `.env` original solo tenía secretos (Resend/Clerk). Sin `DATABASE_URL` los scripts fallan. Corregido y reflejado también en `.env.example`.
- **Pendiente para próxima sesión**:
  - T06 (Clerk + proteger `/admin`) — siguiente tarea. Las claves Clerk test ya están en `.env`, así que se puede trabajar sin bloqueo.
  - Considerar agregar `npm run db:migrate` al CMD del runner Docker (mencionado como pendiente en T04). Mejor en la fase de hardening (T35) o pre-deploy (T39).
- **Verificación realizada**:
  - `npx drizzle-kit generate` → migración `0000_sweet_star_brand.sql` con 8 CREATE TABLE, 6 FKs, 7 índices.
  - `docker compose up -d db` + `npm run db:migrate` → ✓ migrations applied.
  - `npm run db:seed` → "providers in DB: 8" con los 8 nombres del PDF.
  - `psql \dt` → confirma las 8 tablas en `public`.
  - `npm run build` → ✓ Compiled successfully (3.3s), TypeScript ok. **Criterio de aceptación cumplido.**

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

## 2026-04-28 · T22 — SEO básico

- **Estado final**: ✅ completada
- **Archivos tocados**:
  - `app/layout.tsx` — metadata expandida con `metadataBase`, title template, OG/Twitter, robots.
  - `app/sitemap.ts` — sitemap programático (`/`, `/legal/terms`, `/legal/privacy`).
  - `app/robots.ts` — robots con `disallow` para `/admin` y `/checkout`, sitemap apuntando a `NEXT_PUBLIC_APP_URL`.
  - `public/og.png` — placeholder copiado de `logo.png` (sustituir por imagen 1200x630 brandeada cuando cliente entregue).
- **Decisiones clave**:
  - `metadataBase` y URLs derivan de `NEXT_PUBLIC_APP_URL` con fallback a localhost; evita hardcodear dominio.
  - Bloqueo en robots de `/admin` y `/checkout` para que crawlers no indexen panel ni embudo.
- **Verificación realizada**:
  - `npm run build` ok; rutas `/robots.txt` y `/sitemap.xml` listadas como estáticas en el output.
