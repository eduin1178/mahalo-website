# Brand & Style Guide - Mahalo Enterprise

## Personalidad visual

La landing actual busca una estetica:

- Profesional
- Limpia
- Confiable
- Premium pero accesible
- Orientada al funnel, no decorativa
- Con enfasis en hogar conectado, tecnologia, cobertura y ayuda humana

La arquitectura visual es como una casa bien construida: primero cimientos de confianza, luego habitaciones claras para cada decision del usuario. NO llenes la landing de adornos si eso debilita el CTA.

## Paleta principal

| Token | Hex | Uso recomendado |
|---|---:|---|
| `mahalo-navy-900` | `#0B1F4D` | Color principal, headings, fondos oscuros, botones solidos |
| `mahalo-navy-700` | `#142E6E` | Hover / fondos secundarios oscuros |
| `mahalo-blue-600` | `#2A5BC7` | Acentos, links, iconos, gradientes |
| `mahalo-cyan-500` | `#3FD0E0` | Focus, highlights, glow, CTA emphasis |
| `mahalo-cyan-300` | `#7FE3EE` | Texto/acento sobre fondos oscuros |
| `surface` | `#F6F8FB` | Fondos suaves de secciones y tarjetas |
| `border` | `#E2E8F0` | Bordes sutiles |
| `muted-foreground` | `#5B6B85` | Texto secundario |

## Gradientes

### Primary brand gradient

```css
linear-gradient(135deg, #0b1f4d 0%, #2a5bc7 55%, #3fd0e0 100%)
```

Uso: CTA primario, bloques hero/brand, highlights.

### Soft brand gradient

```css
linear-gradient(135deg, rgba(11,31,77,0.06) 0%, rgba(63,208,224,0.1) 100%)
```

Uso: fondos suaves, halos detras de screenshots o tarjetas.

### CTA final

```css
linear-gradient(135deg, #0b1f4d 0%, #142e6e 45%, #2a5bc7 80%, #3fd0e0 100%)
```

## Tipografia

Actual: `Inter` para texto y headings.

Escala observada:

- H1 desktop: 48-60px, weight 700, tracking tight.
- H2: 32-48px, weight 700.
- H3: 18-24px, weight 600-700.
- Body: 16px, line-height amplio.
- Muted text: 14-16px en `#5B6B85`.
- Eyebrow: 12px, uppercase, letter-spacing alto, weight 600.

## Componentes visuales

### Boton primario

- Fondo: brand gradient.
- Texto: blanco.
- Hover: mas brillo y sombra.
- Focus: ring cyan.
- Copy CTA principal: `Check Availability`.

### Boton solido

- Fondo: navy 900.
- Hover: navy 700.
- Uso: seleccion de plan, CTAs secundarios de alta intencion.

### Inputs

- Altura hero: 56px.
- Fondo blanco sobre hero oscuro.
- Texto navy.
- Placeholder navy con opacidad.
- Icono Search en blue 600.
- Focus ring cyan.

### Tarjetas premium

Patron actual:

```css
background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.86));
border: 1px solid rgba(255,255,255,0.72);
box-shadow: 0 30px 80px rgba(4,16,45,0.24), inset 0 1px 0 rgba(255,255,255,0.8);
backdrop-filter: blur(18px);
border-radius: 1.5rem;
```

Uso: planes, add-ons, cards visuales importantes.

### Trust cards

Mas suaves que las tarjetas de planes. Usar para testimonios o beneficios:

```css
background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78));
border: 1px solid rgba(255,255,255,0.78);
box-shadow: 0 24px 60px rgba(11,31,77,0.12);
backdrop-filter: blur(16px);
```

## Fondos de seccion

- Hero: navy profundo con glows cyan/blue, lineas verticales muy sutiles, imagen de hogar conectado a la derecha en desktop.
- Plan highlights: fondo oscuro premium con red abstracta (`assets/backgrounds/plans-network-bg.svg`).
- Providers: fondo claro con gradientes suaves cyan/blue.
- Testimonials: fondo claro invertido con halos cyan/blue.
- Final CTA: gradiente navy -> blue -> cyan.

## Iconografia

La app actual usa `lucide-react`. Estilo recomendado:

- Stroke fino/moderado (`1.75`).
- Iconos dentro de circulos con fondo cyan suave.
- Iconos de confianza: map pin, zap, handshake, shield-check.

## Motion / interaccion

- Hover elevation en tarjetas importantes.
- Marquee pausado en hover/focus para proveedores.
- Respetar `prefers-reduced-motion`.
- En formularios, feedback inmediato y mensajes claros.

## Assets visuales copiados

Ver [`assets-manifest.md`](./assets-manifest.md). Los assets importantes estan en:

- `assets/brand/`
- `assets/hero/`
- `assets/steps/`
- `assets/backgrounds/`
- `assets/providers/`

## Reglas de marca importantes

- Mahalo debe sentirse como guia confiable, no como marketplace agresivo.
- La accion principal SIEMPRE es buscar disponibilidad por ZIP/direccion.
- Usar la ayuda humana como diferenciador: `A real person calls you - no chatbots`.
- Mantener disclaimers de disponibilidad y precios.
- Si se muestran logos/proveedores, usar colores corporativos del proveedor cuando esten disponibles.
