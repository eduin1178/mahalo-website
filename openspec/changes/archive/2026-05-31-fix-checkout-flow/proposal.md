## Why

El flujo de checkout vivo (`Plan → Datos → Instalación → Confirmación`) tiene tres problemas que se atacan en conjunto porque tocan los mismos archivos, pero son entregables separables:

1. **BUG CRÍTICO — La Fase 2 está bloqueada.** En `/checkout/details` el formulario no permite avanzar y **no emite ningún error en la consola del navegador**. Causa raíz: en `components/checkout/phase2-form.tsx` el schema de cliente valida `card: cardClientSchema.partial()` y `ach: achClientSchema.partial()` SIEMPRE, mientras los `defaultValues` inicializan esos campos con strings vacíos. `.partial()` de Zod solo permite que la clave sea `undefined` — NO acepta string vacío — por lo que `""` atraviesa los `regex`/`transform` internos y FALLA (ej. `number` `""` contra `/^\d{13,19}$/`, `routing` `""` contra `/^\d{9}$/`). Como react-hook-form v7 conserva los valores de campos desmontados (`shouldUnregister` por defecto es `false`), esos errores existen aunque los inputs de tarjeta/ACH solo se rendericen cuando el autopago está activo. Resultado: `form.handleSubmit` siempre cae en `onInvalid` (nunca `onSubmit`), `firstInvalidSection` hace scroll a la sección de pago que con autopago apagado no renderiza ningún error visible, `finalizePhase2` jamás se invoca, no hay navegación ni traza en consola. El formulario queda **prácticamente siempre bloqueado**.

2. **Idioma — La UI del checkout debe estar en inglés.** El producto es para mercado US, pero todo el copy visible del checkout está en español. Esto incluye labels, botones, placeholders, mensajes de validación de Zod, estados vacíos, y los mensajes de error de los server actions (hoy inconsistentes: algunos ya en inglés, otros en español).

3. **Jerarquía de precio invertida.** En las cards de selección de plan (`PlanOption`), el precio estándar se muestra grande (`text-3xl bold`) y el precio con autopago diminuto y gris (`text-xs`). El negocio quiere lo contrario: destacar el precio **con autopago** como valor principal y dejar el estándar como secundario.

## What Changes

- **Fix del bug de Fase 2 (Change 1):** Hacer laxos los schemas base de `card`/`ach` en el formulario de cliente (aceptar string vacío / opcional), espejando el patrón ya existente de `billingAddressLooseSchema`. La validación estricta se mantiene SOLO dentro del bloque `superRefine` que ya corre cuando `autopay` está activo y coincide el `paymentMethod`. El server action `finalizePhase2` ya valida de forma robusta con su discriminated union, así que no se pierde seguridad.
- **BREAKING (copy) — UI del checkout en inglés (Change 2):** Traducir todo el copy visible del flujo vivo del checkout y los mensajes de error de los server actions a inglés. Incluye `stepper.tsx`, `phase1-form.tsx`, `phase2-form.tsx`, `schedule-form.tsx`, `order-total-panel*.tsx`, `draft-bootstrap.tsx`, las páginas (`page.tsx`, `details`, `schedule`, `confirmation`, `plan`), los mensajes de Zod, las etiquetas de tipo de teléfono (Celular/Casa/Trabajo → Mobile/Home/Work) y los mensajes de `finalizePhase1/finalizePhase2/scheduleInstallation/createDraftOrder` en `lib/orders/draft-actions.ts`.
- **Override de idioma a nivel de proyecto (Change 2):** Declarar en `AGENTS.md` que la UI de este producto viaja en inglés (mercado US), anulando la regla global de español neutro **solo para este repositorio**. NO se modifica la regla global del usuario.
- **Énfasis de precio con autopago (Change 3):** Invertir la jerarquía tipográfica en `PlanOption` (`phase1-form.tsx`): precio con autopago grande + label "with autopay", precio estándar más pequeño/secundario. Evaluar aplicar la misma lógica al bloque comparativo Estándar / Con autopago en `phase2-form.tsx`.

## Capabilities

### New Capabilities

<!-- No se introducen capabilities nuevas. -->

### Modified Capabilities

- `checkout-wizard`: Se modifica el requisito de idioma (de español neutro a inglés US-market) y se agregan dos requisitos: (a) la validación de cliente de la Fase 2 no debe bloquear el avance cuando el autopago está desactivado, y (b) las cards de plan deben destacar el precio con autopago como valor principal.

## Impact

- **Componentes** (`components/checkout/`): `phase2-form.tsx` (fix de schema + copy), `phase1-form.tsx` (copy + jerarquía de precio), `stepper.tsx`, `schedule-form.tsx`, `order-total-panel.tsx`, `order-total-panel-client.tsx`, `draft-bootstrap.tsx` (copy).
- **Páginas** (`app/(public)/checkout/`): `page.tsx`, `details/page.tsx`, `schedule/page.tsx`, `confirmation/page.tsx`, `plan/page.tsx` (copy).
- **Server actions** (`lib/orders/draft-actions.ts`): mensajes de error visibles al usuario traducidos. Sin cambios de contrato ni de lógica de validación de servidor.
- **Documentación** (`AGENTS.md`): nuevo override de idioma a nivel de proyecto.
- **Sin impacto** en: schema de BD, draft cookie/contrato de `getCurrentDraft()`, integraciones (USPS, Clerk, Resend, R2, n8n), las rutas stub de redirect legacy (`/checkout/customer|add-ons|payment|summary`, que no tienen copy visible).
- **Separabilidad:** el Change 1 (bug) es aislado y urgente — puede desplegarse solo. El Change 2 (idioma) es amplio. El Change 3 (precio) es pequeño y visual. Se recomienda PRs encadenados o, como mínimo, commits por unidad de trabajo.
