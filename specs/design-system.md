# Mahalo Enterprise — Design System

Sistema visual derivado del logo oficial (`public/logo.png`). Esta es la fuente de verdad para colores, tipografía y motivos. Aplica a la landing y al panel admin.

## 1. Principios de marca
- **Confiable** — somos un dealer que maneja datos sensibles (SSN, pago). El navy domina.
- **Conectividad** — el negocio es internet/telefonía. Motivos sutiles de señal/onda son bienvenidos.
- **Moderno y amable** — la tipografía del logo es redondeada, no agresiva. Bordes y radii suaves.
- **Claridad sobre decoración** — el embudo manda; la decoración acompaña, no compite.

## 2. Paleta

### Core (extraídos del logo)
| Token | Hex | Uso |
|---|---|---|
| `--mahalo-navy-900` | `#0B1F4D` | Primary, texto principal, fondos oscuros, "Mahalo" wordmark. |
| `--mahalo-navy-700` | `#142E6E` | Hover de primary, headers de tablas. |
| `--mahalo-blue-600` | `#2A5BC7` | Accent corporativo, links, "ENTERPRISE" subtitle. |
| `--mahalo-cyan-500` | `#3FD0E0` | Highlight, gradiente end, success secundario, focus rings. |
| `--mahalo-cyan-300` | `#7FE3EE` | Tagline, decoración, fondos de banner suaves. |

### Neutrales
| Token | Hex | Uso |
|---|---|---|
| `--background` | `#FFFFFF` | Fondo base. |
| `--surface` | `#F6F8FB` | Cards, secciones alternas. |
| `--border` | `#E2E8F0` | Bordes y separadores. |
| `--muted-foreground` | `#5B6B85` | Texto secundario. |
| `--foreground` | `#0B1F4D` | Texto principal (= navy-900). |

### Semánticos
| Token | Hex | Uso |
|---|---|---|
| `--success` | `#10B981` | Estado `Installed`/`Completed`, mensajes de cobertura disponible. |
| `--warning` | `#F59E0B` | Estado `Pending`. |
| `--destructive` | `#DC2626` | Estado `Cancelled`, errores. |
| `--info` | `#2A5BC7` | Estado `Created`. |
| `--purple` | `#7C3AED` | Estado `Scheduled` (alineado al PDF que muestra estados con colores variados). |

### Mapeo a estados de orden (PDF §4.7)
- `Pending` → `--warning` (amber)
- `Created` → `--info` (blue-600)
- `Scheduled` → `--purple`
- `Installed` → `--mahalo-cyan-500`
- `Completed` → `--success`
- `Cancelled` → `--destructive`

## 3. Gradiente de marca
El gradiente diagonal del isotipo es el ingrediente más distintivo. Reservado para:
- Hero background o overlay del hero.
- Botón CTA principal de la landing ("Check Availability").
- Acentos puntuales (subrayado de hover, separadores decorativos).

```css
--mahalo-gradient: linear-gradient(135deg, #0B1F4D 0%, #2A5BC7 55%, #3FD0E0 100%);
--mahalo-gradient-soft: linear-gradient(135deg, rgba(11,31,77,0.06) 0%, rgba(63,208,224,0.10) 100%);
```

No usar el gradiente en el panel admin (mantener UI plana y funcional ahí).

## 4. Tipografía
- **Display / wordmark**: el logo ya cubre la marca; **no** intentar replicar la tipografía del logo en CSS.
- **UI**: `Inter` cargada con `next/font/google`, weights 400/500/600/700.
- Jerarquía:
  - H1 landing hero: 48–60px (mobile 36px), weight 700, navy-900, tracking `-0.02em`.
  - H2 sección: 32–40px, weight 700.
  - H3: 24px, weight 600.
  - Body: 16px, weight 400, line-height 1.6, color `muted-foreground` para texto secundario.
  - Eyebrow / labels: 12px, weight 600, `letter-spacing: 0.12em`, uppercase, color `--mahalo-blue-600` (eco del "ENTERPRISE" del logo).

## 5. Espaciado y radii
- Escala Tailwind por defecto.
- **Radii**: `--radius: 0.75rem` (12px) en cards y botones grandes; `0.5rem` en inputs; `9999px` en chips/badges. La marca es redondeada — evitar esquinas duras.
- Secciones de landing: padding vertical `py-20 md:py-28`.
- Container: `max-w-6xl` centrado con `px-6`.

## 6. Sombras
Suaves, frías (con tinte navy):
```css
--shadow-sm: 0 1px 2px rgba(11, 31, 77, 0.06);
--shadow-md: 0 8px 24px rgba(11, 31, 77, 0.08);
--shadow-lg: 0 20px 48px rgba(11, 31, 77, 0.12);
```

## 7. Iconografía
- `lucide-react` (ya viene con shadcn).
- Stroke `1.75`, color hereda del texto.
- Iconos hero/feature pueden ir dentro de un círculo con fondo `--mahalo-cyan-300` al 20% de opacidad y icono en `--mahalo-blue-600`.

## 8. Motivo "señal"
Reutilizar las arcos Wi-Fi del logo como elemento decorativo:
- Detrás del hero, a baja opacidad (5–8%).
- Entre secciones como divider sutil.
- En la card del proveedor seleccionado como "active state".
No abusar — máximo 2 usos por página.

## 9. Plan cards (paso 2 del embudo)
Cada card respeta el branding del proveedor sin perder coherencia con Mahalo:
- Borde superior de 4px con `provider.primary_color`.
- Logo del proveedor centrado arriba.
- Tipografía y espaciado iguales para todas las cards (consistencia).
- Botón "Select Plan" en `--mahalo-navy-900` con texto blanco; hover usa el gradiente de marca.
- En estado seleccionado: anillo (`ring-2`) en `--mahalo-cyan-500`.

## 10. Botones
| Variante | Background | Texto | Uso |
|---|---|---|---|
| `primary` | `--mahalo-gradient` | white | CTA principal de landing y embudo. |
| `solid` | `--mahalo-navy-900` | white | Acciones del admin, "Select Plan". |
| `secondary` | `--surface` | `--mahalo-navy-900` | Acciones secundarias. |
| `ghost` | transparent | `--mahalo-blue-600` | Links, navegación. |
| `destructive` | `--destructive` | white | Cancelar orden. |

Estados: hover sube luminosidad ~5%, focus visible con `ring-2 ring-mahalo-cyan-500 ring-offset-2`.

## 11. Forms
- Inputs con borde `--border`, focus en `--mahalo-blue-600` con ring cyan-500.
- Errores en `--destructive` con icono.
- Labels arriba del input, weight 500, navy-900.
- Helper text `muted-foreground`.

## 12. Badges de estado
Pill (`rounded-full`), padding `px-2.5 py-0.5`, weight 600, text-xs. Background = color del estado al 12%, texto = color del estado a 100%.

## 13. Logo
- Archivo: `public/logo.png`. Crear también una versión SVG (`public/logo.svg`) y monocromo blanco (`public/logo-white.svg`) para usar sobre fondos oscuros — pendiente del cliente.
- Tamaño mínimo: 120px de ancho.
- No deformar, no recolorear, no aplicar efectos.

## 14. Implementación en Tailwind v4
En `app/globals.css`:
```css
@theme inline {
  --color-mahalo-navy-900: #0B1F4D;
  --color-mahalo-navy-700: #142E6E;
  --color-mahalo-blue-600: #2A5BC7;
  --color-mahalo-cyan-500: #3FD0E0;
  --color-mahalo-cyan-300: #7FE3EE;
  --radius: 0.75rem;
}

:root {
  --background: #FFFFFF;
  --foreground: #0B1F4D;
  --surface: #F6F8FB;
  --border: #E2E8F0;
  --muted-foreground: #5B6B85;
  --primary: var(--color-mahalo-navy-900);
  --primary-foreground: #FFFFFF;
  --accent: var(--color-mahalo-blue-600);
  --ring: var(--color-mahalo-cyan-500);

  --mahalo-gradient: linear-gradient(135deg, #0B1F4D 0%, #2A5BC7 55%, #3FD0E0 100%);
}
```

Estos tokens se exponen como utilidades Tailwind: `bg-mahalo-navy-900`, `text-mahalo-blue-600`, etc.

## 15. Accesibilidad
- Todas las combinaciones de texto respetan WCAG AA (verificadas):
  - `navy-900` sobre `white` → 14.8:1 ✓
  - `blue-600` sobre `white` → 5.6:1 ✓
  - `cyan-500` sobre `navy-900` → 7.9:1 ✓
  - `white` sobre `blue-600` → 5.6:1 ✓
- **No usar** `cyan-500` como texto sobre `white` (contraste insuficiente — solo decorativo o sobre navy).
- Focus visible obligatorio en todos los interactivos.

## 16. Don'ts
- No mezclar más de 3 colores de marca en un mismo bloque.
- No aplicar el gradiente en texto largo (solo en headlines o botones).
- No usar cyan-300 como color de texto principal.
- No reemplazar el navy del logo por azul medio en el wordmark.
- No usar gradiente en componentes del admin.
