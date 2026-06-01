## Context

El checkout vivo es un wizard de 3 fases bajo `app/(public)/checkout/` (ver spec `checkout-wizard`). El estado se persiste en un `draft` server-side (`lib/orders/draft.ts`) y avanza con server actions (`lib/orders/draft-actions.ts`). La Fase 2 (`/checkout/details`) usa `components/checkout/phase2-form.tsx`, un Client Component con react-hook-form + zodResolver que llama al server action `finalizePhase2`, el cual valida con un discriminated union robusto y termina en `redirect("/checkout/schedule")`.

Stack: Next.js 16 App Router, React, Tailwind v4, shadcn/ui, Zod, react-hook-form v7.

Este change agrupa tres correcciones que coinciden en los mismos archivos pero son lógicamente independientes y deben poder entregarse por separado.

## Goals / Non-Goals

**Goals:**
- Desbloquear el avance de la Fase 2 sin debilitar la validación de servidor.
- Dejar toda la UI visible del checkout en inglés, de forma consistente (incluidos errores de server actions y mensajes de Zod).
- Destacar el precio con autopago como valor principal en las cards de plan.
- Documentar el idioma del producto a nivel de proyecto sin tocar reglas globales del usuario.

**Non-Goals:**
- No se rediseña el wizard ni se cambia el modelo de datos, draft o server actions (solo copy de errores).
- No se introduce i18n/multi-locale: el producto pasa a inglés fijo, no a un sistema de traducciones.
- No se tocan las rutas stub de redirect legacy (no tienen copy).
- No se cambia la validación de servidor (sigue siendo la fuente de verdad de seguridad).

## Decisions

### Decisión 1: Fix del bug — schema base laxo + validación estricta condicional (Opción A)

**Elegido:** Reemplazar `card: cardClientSchema.partial()` / `ach: achClientSchema.partial()` por schemas base **laxos** que aceptan string vacío (mismo patrón que `billingAddressLooseSchema` ya presente en el archivo). La validación estricta de tarjeta/ACH permanece exclusivamente dentro del `superRefine` existente, que ya se ejecuta solo cuando `v.autopay === true` y según `v.paymentMethod`.

**Por qué falla hoy:** `.partial()` hace cada clave opcional (acepta `undefined`), pero los `defaultValues` proveen `""`, que NO es `undefined`. Zod entonces valida `""` contra el `regex` interno y falla. Con `shouldUnregister: false` (default de RHF v7), esos valores se validan aunque los inputs estén desmontados.

**Alternativas consideradas:**
- *Opción B — defaults `undefined`*: frágil; RHF rellena inputs controlados con `""` al interactuar, reintroduciendo el problema.
- *Opción C — `shouldUnregister: true`*: efecto global sobre el form; riesgo de romper otros campos condicionales (billing).

**Rationale:** La Opción A es consistente con un patrón ya usado y probado en el mismo archivo, es mínima, y no mueve la frontera de seguridad: el server action `finalizePhase2` mantiene su discriminated union con validación Luhn incluida.

**Trade-off:** El schema de cliente deja de pre-validar tarjeta/ACH cuando el autopago está apagado (correcto: esos campos no aplican). Cuando el autopago está encendido, el `superRefine` sigue validando estrictamente antes de enviar.

### Decisión 2: Inglés fijo, sin sistema de i18n

**Elegido:** Reemplazar literales en español por inglés directamente en los componentes/páginas/acciones. No se agrega `next-intl`/diccionarios.

**Rationale:** El alcance es un único locale (US). Introducir i18n sería sobre-ingeniería para un producto mono-idioma. Si en el futuro se requiere multi-locale, será un change aparte.

**Cobertura:** labels, botones, placeholders, mensajes de Zod (`message` de cada validador), estados vacíos/éxito, aria-labels visibles, etiquetas de tipo de teléfono, y los `error` que devuelven los server actions. Se unifica la inconsistencia actual (algunos mensajes ya están en inglés).

### Decisión 3: Override de idioma a nivel de proyecto, no global

**Elegido:** Agregar a `AGENTS.md` una nota explícita: la UI de producto de este repositorio viaja en **inglés (mercado US)**, lo cual anula la regla global de español neutro **solo para este proyecto**.

**Rationale:** La regla global del usuario (`~/.claude/CLAUDE.md`) aplica a TODOS sus proyectos. Voltearla a inglés rompería el español neutro en sus demás productos. El scoping correcto es declarar la excepción donde vive el contexto: el repo. Atacar un requerimiento local con un cambio global es exactamente el tipo de fuga de alcance que genera regresiones silenciosas.

### Decisión 4: Énfasis de precio — invertir jerarquía tipográfica

**Elegido:** En `PlanOption` (`phase1-form.tsx`), el precio **con autopago** pasa a ser el valor grande/primario con un label "with autopay"; el precio estándar se muestra más pequeño y secundario.

```
   ANTES                          DESPUÉS
   ┌──────────────┐               ┌──────────────────────┐
   │  $79.99 /mo  │ ◀ 3xl bold    │  $69.99 /mo          │ ◀ grande + primario
   │  $69.99 with │ ◀ xs gris     │  with autopay        │
   │  autopay     │               │  $79.99/mo standard  │ ◀ pequeño/secundario
   └──────────────┘               └──────────────────────┘
```

**Abierto a implementación:** si el precio estándar se muestra tachado o simplemente más pequeño/gris; y si se aplica el mismo énfasis al bloque comparativo Estándar / Con autopago de `phase2-form.tsx`.

### Decisión 5: Entregables separables

**Elegido:** Estructurar tasks en grupos por change para que el fix del bug (Grupo 1) pueda implementarse, verificarse y desplegarse de forma autónoma, idealmente como PRs encadenados o commits por unidad de trabajo.

**Rationale:** El bug es urgente y aislado; no debe quedar bloqueado por la traducción amplia ni por el ajuste visual.

## Risks / Trade-offs

- **Traducción incompleta deja UI mixta** → Mitigación: barrido exhaustivo archivo por archivo según el checklist de tasks; QA visual de las 3 fases + estados de error.
- **Mensajes de Zod del cliente vs servidor divergen** → Mitigación: traducir ambos lados (client `formSchema` y server schemas) y revisar que coincidan semánticamente.
- **El fix del schema podría permitir enviar datos de pago basura cuando autopago está activo** → Mitigación: NO; el `superRefine` y el server action siguen validando estrictamente cuando `autopay === true`. El fix solo afecta el caso autopago apagado.
- **Override en AGENTS.md ignorado por futuros cambios** → Mitigación: redactarlo de forma explícita y visible como sección propia.

## Migration Plan

1. **Grupo 1 (bug)**: aplicar fix de schema, verificar avance de Fase 2 con autopago ON y OFF, desplegar.
2. **Grupo 2 (idioma)**: traducir copy + agregar override en AGENTS.md.
3. **Grupo 3 (precio)**: ajustar jerarquía en cards de plan.
4. **QA**: recorrer flujo completo en desktop y mobile; validar avance de Fase 2, copy en inglés, énfasis de precio.
5. **Sin migración de BD ni de datos.** Rollback = revertir el/los PR.

## Open Questions

- ¿El precio estándar se muestra tachado o solo más pequeño/gris? (decidir en implementación según diseño visual).
- ¿Se aplica el énfasis de autopago también al bloque comparativo de `phase2-form.tsx`, o solo a las cards de `phase1-form.tsx`?
- ¿La pantalla de confirmación (`/checkout/confirmation`) y el `order-total-panel` tienen copy que también deba revisarse por completo? (incluido en el barrido, confirmar alcance al implementar).
