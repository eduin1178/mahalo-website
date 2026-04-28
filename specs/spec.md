# Mahalo Enterprise — Especificación funcional

Fuente: `docs/mahalo-enterprise-requierements.pdf` (v1.0, abril 2025).

## 1. Objetivo
Sitio web para Mahalo Enterprise (dealer de proveedores de internet/telefonía en EE.UU.) compuesto por:
- **Landing pública** (`/`) con embudo de compra multi-paso.
- **Panel admin** (`/admin`) protegido por Clerk para gestión de proveedores, planes, add-ons, cobertura, órdenes y clientes.

Dominio: `mahaloenterprise.com`. Idioma: inglés. Email notificaciones: `noreply@mahaloenterprise.com`.

## 2. Stack obligatorio
Next.js 16 (App Router) · Tailwind CSS v4 · shadcn/ui · PostgreSQL · Clerk · Resend · Docker Compose · Dokploy · USPS API · n8n webhook.

> Esta versión de Next.js tiene cambios incompatibles con versiones anteriores. Antes de codificar, leer la guía relevante en `node_modules/next/dist/docs/`.

## 3. Proveedores soportados
Kinetic, Brightspeed, Frontier, EarthLink, Optimum, Verizon Fios, AT&T, Spectrum.

## 4. Modelo de negocio
- Mahalo actúa como intermediario; **no procesa pagos**.
- Cliente completa registro → agente lo contacta para verificar SSN/fecha de nacimiento → agente registra la orden con el proveedor → proveedor cobra y factura.

## 5. Landing pública

### 5.1 UX
Mobile-first, profesional, énfasis en el embudo (búsqueda de dirección + selección de plan). Cards con branding del proveedor (logo + color corporativo). Logo y paleta Mahalo: pendiente del cliente.

### 5.2 Secciones de navegación
1. Hero (búsqueda dirección/ZIP como CTA)
2. Why Choose Us
3. Available Providers (logos)
4. How It Works
5. FAQ
6. Testimonials
7. Footer (Terms, Privacy, Contact)

### 5.3 Embudo de compra
| Paso | Nombre | Notas |
|---|---|---|
| 1 | Address/ZIP search | Validación con USPS API; el ZIP determina cobertura. |
| 2 | Provider & Plan | Consulta `provider_coverage`. Mensaje de éxito o "sin cobertura". Cards con logo, color, nombre, velocidad, precio, features, CTA. |
| 3 | Add-ons (opcional) | Solo si el proveedor tiene add-ons activos. |
| 4 | Order Summary | Plan, add-ons, total estimado, dirección de instalación. |
| 5 | Customer Info | First, Last, Email, Phone, Phone Type (mobile/landline), Installation Address (pre-llenada, editable), Billing Address (toggle). |
| 6 | Payment Preference | Autopay ON/OFF (mostrar diferencia de precio). Si ON: tarjeta (número, titular, exp, CVV) o ACH (routing, account, type). **Almacenado en plain text** — PCI a cargo del cliente. |
| 7 | Installation Schedule | Lun–Sáb, 8:00 AM – 5:00 PM, solo fechas/horas futuras. |
| 8 | Confirmation | Pantalla de éxito + dispara notificaciones (email + webhook). No se cobra nada. |

## 6. Panel admin (`/admin`)

### 6.1 Autenticación
Clerk. Solo usuarios autenticados. Invitaciones/desactivación desde dashboard de Clerk.

### 6.2 Roles
- **Admin** — acceso total.
- **Agent** — gestiona órdenes y clientes; lectura de proveedores/planes.

### 6.3 Módulos
- **Providers**: name, logo, primary_color, is_active.
- **Plans** (por proveedor): name, speed, price_standard, price_autopay, features[], is_active, sort_order.
- **Add-ons** (por proveedor): name, description, price, is_active.
- **Coverage**: ZIP codes por proveedor. Bulk import CSV recomendado para sprint futuro.
- **Orders**: estados `Pending → Created → Scheduled → Installed → Completed` (+ `Cancelled`). Detalle con info completa, historial de cambios de estado (timestamp + agente), reschedule.
- **Customers**: listado y detalle con historial de órdenes.
- **Settings** key-value (`notification_email`, `webhook_url`, extensible).

## 7. Notificaciones
- **Email** vía Resend al `notification_email` configurado, con resumen de la orden.
- **Webhook** HTTP POST al `webhook_url` (n8n) con payload JSON completo.
- Notificaciones al cliente las maneja n8n; la app no envía emails al cliente.

## 8. Modelo de datos (entidades)
`providers`, `plans`, `add_ons`, `provider_coverage`, `customers`, `orders`, `order_status_history`, `settings`. Detalle de columnas en sección 6 del PDF.

## 9. Integraciones externas
| Servicio | Uso | Config |
|---|---|---|
| USPS API | Validar dirección/ZIP | env vars |
| Clerk | Auth admin | Clerk dashboard + env |
| Resend | Email a admin/agentes | API key env + email en admin panel |
| n8n | Webhook automatizaciones | URL en admin panel |

## 10. Pendientes del cliente
Logo + paleta Mahalo · referencias visuales · orden de display de planes en paso 2 · CSV bulk import (futuro) · textos legales · contenido FAQ y Testimonials · credenciales USPS · setup Clerk · API key Resend + dominio · estrategia de cifrado para datos de pago en reposo.

## 11. Criterios de aceptación
- Landing 100% responsive, embudo completable en mobile.
- Búsqueda por ZIP retorna proveedores reales desde DB en <1s.
- Crear una orden dispara email + webhook (verificable end-to-end).
- `/admin` redirige a login si no autenticado; rol `Agent` no ve gestión de proveedores.
- App levanta con `docker compose up` con todas las envs configuradas.
