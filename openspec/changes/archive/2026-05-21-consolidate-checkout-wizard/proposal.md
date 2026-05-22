## Why

El flujo de checkout actual presenta al usuario una barra de progreso con **8 pasos** (`Address → Plan → Add-ons → Summary → Customer → Payment → Schedule → Confirm`), lo cual resulta abrumador y genera abandono en la conversión desde la búsqueda de ZIP. Dos de esos pasos no son realmente decisiones del usuario: `Address` es un loader transitorio que crea el draft y redirige, y `Confirm` es la pantalla terminal post-envío. Otros pasos como `Add-ons` ya se auto-saltan si el proveedor no tiene extras, y `Summary` interrumpe el flujo sin permitir editar in-situ. Agrupar el wizard en **3 fases mentales** (qué quiero, quién soy, cuándo lo instalan) reduce la fricción percibida sin perder información, manteniendo la integridad de los datos que se persisten en el draft.

## What Changes

- **BREAKING**: El stepper público pasa de 8 pasos a **3 fases** visibles: `Plan` → `Datos` → `Instalación`.
- Fusionar `/checkout/plan` + `/checkout/add-ons` en una sola vista **Fase 1 — Tu plan**, con selección de plan arriba y add-ons del proveedor desplegándose debajo al elegir plan.
- Fusionar `/checkout/customer` + `/checkout/payment` en una sola vista **Fase 2 — Tus datos**, organizada en secciones (contacto, dirección de instalación, dirección de facturación, preferencia de pago) con validación unificada al avanzar.
- Fusionar `/checkout/schedule` + `/checkout/summary` (revisión final) en una sola vista **Fase 3 — Instalación y confirmación**, con calendario arriba y desglose consolidado abajo, terminando en el botón de envío.
- Promover el desglose de costos a un **panel persistente** (sidebar en desktop, sticky bottom bar en mobile) visible en las 3 fases, eliminando la pantalla dedicada `/checkout/summary`.
- La ruta `/checkout` (bootstrap) sigue existiendo como loader técnico pero no aparece en el stepper.
- La pantalla post-envío (`/checkout/confirmation`) sigue existiendo como terminal pero no aparece en el stepper.
- Eliminar el paso fantasma de add-ons cuando el proveedor no tiene extras (hoy se manifiesta como un parpadeo de redirect).
- Toda copia visible al usuario debe estar en **español neutro con "tú"**, sin voseo ni regionalismos.

## Capabilities

### New Capabilities

- `checkout-wizard`: Flujo de compra post-cobertura. Cubre la arquitectura de 3 fases, el orden de captura de datos, los guards de navegación entre fases, el panel de total persistente, las reglas de validación parcial por sección, y la transición a la pantalla terminal de confirmación.

### Modified Capabilities

<!-- No hay specs existentes que cubran el checkout; se introduce uno nuevo. -->

## Impact

- **Rutas afectadas** (`app/(public)/checkout/`): se reorganiza el árbol. Las páginas actuales `/plan`, `/add-ons`, `/summary`, `/customer`, `/payment`, `/schedule` se consolidan en 3 rutas (`/plan`, `/details`, `/schedule`) o equivalentes. `/checkout` (bootstrap) y `/checkout/confirmation` se mantienen.
- **Componentes** (`components/checkout/`): `stepper.tsx` se rediseña a 3 grupos. Los forms (`plan-card.tsx`, `add-ons-form.tsx`, `customer-form.tsx`, `payment-form.tsx`, `schedule-form.tsx`) se mantienen como componentes reutilizables pero se componen en vistas combinadas. Nuevo componente `order-total-panel.tsx` para el sidebar persistente.
- **Guards de navegación**: la lógica de `redirect()` que hoy vive en cada `page.tsx` (verifica `providerId`, `planId`, `customerId`) se reagrupa por fase. Validación parcial al avanzar entre fases.
- **Server actions y draft** (`lib/orders/draft.ts`, `draft-actions.ts`): sin cambios de contrato; se siguen persistiendo los mismos campos en el mismo orden lógico.
- **Cálculo de totales** (`lib/orders/totals.ts`): se invoca desde el panel persistente en lugar de solo en `/summary`; verificar que sea seguro llamarlo con drafts parciales (sin plan, sin add-ons).
- **Telemetría / analytics**: si hay eventos por step navegado, los nombres de pasos cambian — actualizar tracking.
- **Tests E2E**: cualquier prueba que navegue por URL del checkout debe actualizarse a las 3 rutas consolidadas.
- **Sin impacto** en: schema de BD, integraciones (USPS, Clerk, Resend, n8n), modelo de proveedores/planes/add-ons.
