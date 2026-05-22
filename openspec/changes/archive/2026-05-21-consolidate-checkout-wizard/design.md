## Context

El checkout actual vive en `app/(public)/checkout/` con una página por paso y un `CheckoutStepper` compartido en el layout que pinta 8 chips horizontales. El estado se persiste en un `draft` (server-side, ver `lib/orders/draft.ts`) que se va completando paso a paso. Cada `page.tsx` hace `redirect()` defensivo si faltan precondiciones en el draft (ej. no se puede entrar a `/payment` sin `customerId`). El cálculo de totales (`lib/orders/totals.ts`) se invoca hoy en `/summary`, `/payment` y `/confirmation`.

La fricción no está en la cantidad de datos a capturar — está en la **cantidad de pantallas** entre el momento en que el usuario decide comprar y el momento en que confirma. Cada navegación es un punto potencial de abandono. El objetivo es reducir saltos de página agrupando vistas afines, sin cambiar el modelo de datos ni el orden lógico de captura.

Stack relevante: Next.js 16 App Router, Server Components por defecto, Server Actions para mutaciones del draft, Tailwind v4, shadcn/ui.

## Goals / Non-Goals

**Goals:**
- Reducir las pantallas percibidas de 6 (las "reales") a **3 fases**.
- Mantener `getCurrentDraft()` y las server actions existentes sin cambios de contrato.
- Hacer el costo total **visible en todo momento** (panel persistente), eliminando la necesidad de una pantalla dedicada de resumen.
- Permitir desplegar el cambio sin migración de datos.
- Garantizar que cualquier draft a medio completar (creado con el flujo anterior) siga siendo navegable con la nueva estructura.

**Non-Goals:**
- Rediseñar los forms individuales (`customer-form`, `payment-form`, etc.) más allá de lo necesario para componerlos en una vista combinada.
- Cambiar el schema de BD o las integraciones (USPS, Clerk, Resend, n8n).
- Introducir un cliente-side state manager (Zustand/Redux). Seguimos con server state + server actions.
- Soportar edición no-lineal libre (el flujo sigue siendo direccional fase 1 → 2 → 3; se permite retroceder pero no saltar adelante sin completar la fase actual).
- Internacionalización: el alcance se mantiene en español neutro + inglés actual (no se agregan más locales).

## Decisions

### Decisión 1: Consolidación por rutas (Enfoque A), no solo agrupación visual (Enfoque B)

**Elegido:** Reducir a 3 rutas reales (`/checkout/plan`, `/checkout/details`, `/checkout/schedule`) que componen los forms existentes.

**Alternativa considerada:** Mantener las 6 rutas y solo cambiar el stepper para agruparlas visualmente en 3 grupos.

**Rationale:** La fricción percibida viene de la navegación entre páginas (cada `redirect()`/`router.push()` es un round-trip al servidor con full re-render bajo el App Router). Solo cambiar el stepper sin reducir saltos no resuelve el problema raíz. El costo de refactor es razonable porque los **componentes de form** ya están bien encapsulados — solo cambiamos qué `page.tsx` los compone.

### Decisión 2: Mapeo de rutas

```
ANTES                          DESPUÉS
─────────────────────────      ─────────────────────────
/checkout              ──▶     /checkout              (bootstrap, sin cambio)
/checkout/plan         ──▶     /checkout/plan         (compone Plan + Add-ons)
/checkout/add-ons      ──▶     [eliminada]
/checkout/summary      ──▶     [eliminada — sidebar persistente]
/checkout/customer     ──▶     /checkout/details      (compone Customer + Payment)
/checkout/payment      ──▶     [eliminada]
/checkout/schedule     ──▶     /checkout/schedule     (compone Schedule + revisión final)
/checkout/confirmation ──▶     /checkout/confirmation (sin cambio, terminal)
```

**Compatibilidad hacia atrás de URLs:** las rutas eliminadas (`/add-ons`, `/summary`, `/payment`, `/customer`) deben redirigir 302 a la nueva ruta consolidada correspondiente, preservando el draft. Esto cubre usuarios con un draft activo o bookmarks.

### Decisión 3: Panel de total persistente en lugar de pantalla `/summary`

**Elegido:** Crear `<OrderTotalPanel>` que aparece como sidebar derecho (≥lg) o sticky bottom collapsible (mobile) en las 3 fases. Lee del draft y recalcula vía `calculateTotal()`.

**Rationale:** Tener el total visible en todo momento reduce ansiedad y elimina la necesidad de un paso "Review" intermedio. La pantalla `/summary` era un punto muerto: el usuario veía el total pero no podía editar; tenía que retroceder.

**Trade-off:** `calculateTotal()` hoy retorna `null` si el draft no tiene `providerId`/`planId`. El panel debe manejar este estado parcial mostrando un placeholder ("Elige un plan para ver el total") sin romper la página.

### Decisión 4: Validación parcial por sección dentro de cada fase

**Elegido:** Cada fase tiene un único botón "Continuar" que valida todas las secciones de esa fase. Si hay errores, se hace scroll a la primera sección con error y se muestran los mensajes inline.

**Alternativa:** Validar sección por sección con acordeón que solo deja avanzar al expandir la siguiente.

**Rationale:** Validación al final permite que el usuario llene en el orden que prefiera y reduce micro-interrupciones. El acordeón añade complejidad de estado y no aporta valor claro cuando todos los datos son obligatorios al final.

### Decisión 5: Server Components + Server Actions, sin client-side router state

**Elegido:** Cada fase es un Server Component que lee el draft y renderiza los forms (Client Components donde sea necesario para interactividad). El avance entre fases es una Server Action que valida y hace `redirect()`.

**Rationale:** Coherente con el resto del proyecto (Next.js 16 App Router). Evita duplicar estado entre cliente y servidor. La latencia del redirect es aceptable porque ocurre solo 2 veces (entre fases), no 6.

### Decisión 6: Stepper rediseñado a 3 grupos con etiquetas en español neutro

**Elegido:** `CheckoutStepper` se reescribe con 3 entradas: `Plan`, `Datos`, `Instalación`. Sin numeración del tipo "Step 1 of 8". Las páginas individuales eliminan los eyebrows `Step N of 8`.

### Decisión 7: Add-ons inline sin pantalla intermedia

**Elegido:** Dentro de la Fase 1, los add-ons se renderizan condicionalmente debajo del selector de plan, solo si el proveedor del plan elegido tiene add-ons activos. Si no hay add-ons, la sección simplemente no aparece — sin redirect fantasma.

## Risks / Trade-offs

- **Vista de Fase 2 puede quedar larga en mobile** (contacto + dirección instalación + dirección facturación + pago) → Mitigación: usar secciones visualmente delimitadas con encabezados claros y un sticky CTA "Continuar" al fondo. Medir scroll real antes de decidir si introducir acordeón.
- **`calculateTotal()` invocado con drafts parciales** desde el panel persistente puede generar errores que hoy no ocurren → Mitigación: blindar el panel con un guard que solo invoque el cálculo cuando `draft.providerId && draft.planId`; mostrar placeholder antes.
- **URLs antiguas en bookmarks/emails** quedan rotas si no hay redirects → Mitigación: agregar redirects 302 explícitos en las rutas eliminadas que preserven `searchParams` y el draft cookie.
- **Tests E2E rotos** por cambios de URL → Mitigación: actualizar tests en el mismo PR; usar selectores semánticos (roles, labels) en lugar de URLs cuando sea posible.
- **Telemetría de funnel pierde granularidad** al colapsar 6 eventos en 3 → Mitigación: si existen eventos de tracking por paso, mapear los nuevos pasos y conservar eventos intra-fase (ej. "plan_seleccionado", "add_on_agregado") para no perder visibilidad de drop-off.
- **Drafts en vuelo de usuarios actuales** podrían tener `customerId` pero no `paymentData`, lo cual antes resolvía el redirect entre `/customer` y `/payment` → Mitigación: la Fase 2 detecta qué secciones están completas y resalta visualmente las que faltan; nunca bloquea al usuario por estado intermedio del draft.

## Migration Plan

1. **Implementación**: feature branch con todo el cambio (rutas nuevas, stepper, panel, redirects de URLs viejas).
2. **QA manual**: recorrer el flujo completo en desktop y mobile con un proveedor que tenga add-ons y otro que no.
3. **Deploy**: rolling deploy estándar. Como no hay cambios de schema, no requiere migración de BD.
4. **Rollback**: revertir el branch. Los drafts persistidos durante la ventana del nuevo flujo siguen siendo compatibles porque el shape no cambió.

## Open Questions

- ¿Existe telemetría de funnel hoy que requiera coordinación con el equipo de analytics antes del deploy? Si sí, definir el mapeo de eventos antes de implementar.
- ¿La Fase 2 debe ofrecer "usar misma dirección para facturación" como toggle por defecto activado? (Probable mejora UX, pero confirmar con el comportamiento actual de `customer-form.tsx`.)
- ¿El panel de total persistente debe mostrar el comparativo standard vs autopay siempre, o solo cuando el usuario toca la sección de pago? Decidir en implementación según el espacio disponible.
