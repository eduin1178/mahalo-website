# Source Reference

Esta guia fue extraida del proyecto actual sin modificar la aplicacion.

## Fuentes inspeccionadas

- `README.md` - descripcion general del producto y stack.
- `docs/mahalo-enterprise-requierements.pdf` - requerimientos originales de landing page.
- `app/layout.tsx` - metadata SEO y descripcion publica.
- `app/(public)/page.tsx` - orden actual de secciones de landing.
- `components/landing/hero.tsx` - hero, headline, CTA, beneficios y proveedores.
- `components/landing/hero-search.tsx` - comportamiento y copy del input ZIP/direccion.
- `components/landing/stat-strip.tsx` - stats actuales.
- `components/landing/plan-highlights.tsx` - ejemplos de planes y disclaimers.
- `components/landing/how-it-works.tsx` - flujo de tres pasos.
- `components/landing/providers-grid.tsx` y `providers-carousel.tsx` - proveedores disponibles y patron visual.
- `components/landing/why-choose-us.tsx` - beneficios principales.
- `components/landing/testimonials.tsx` - testimonios placeholder.
- `components/landing/faq.tsx` - FAQ base.
- `components/landing/final-cta.tsx` - CTA final.
- `components/landing/site-footer.tsx` y `nav-config.ts` - navegacion y footer.
- `app/globals.css` - tokens de color, gradientes y utilidades visuales.
- `app/style-guide/page.tsx` - guia visual interna.
- `components/ui/button.tsx`, `input.tsx`, `card.tsx` - patrones de UI.
- `lib/db/seed.ts` - proveedores y colores corporativos.
- `lib/legal/company.ts` - identidad legal/contacto.
- `app/(public)/legal/terms/page.tsx` y `privacy/page.tsx` - limites legales del negocio.

## Identidad legal/contacto actual

- Public brand: `Mahalo Enterprise`
- Legal entity: `Mahalo Enterprise`
- Site: `www.mahaloenterprise.com`
- URL: `https://www.mahaloenterprise.com`
- Email: `mahaloenterprise1@gmail.com`
- Phone: `+1 (551)-331-6440`
- Address: `7717 Newkirk Ave, North Bergen, NJ 07047`
- Governing state: `New Jersey`
- Legal last updated: `May 30, 2026`

## Stack del proyecto fuente

- Next.js 16 App Router
- Tailwind CSS v4
- shadcn/ui + Base UI primitives
- PostgreSQL / Neon
- Drizzle ORM
- Clerk
- Resend
- Cloudflare R2
- USPS API
- n8n webhook
- Vercel / deployment docs existentes

## Notas de precision

- Algunos contenidos de marketing en el proyecto actual estan marcados como placeholders: stats, testimonials y ciertos ejemplos de planes.
- El PDF original indica que logo y paleta estaban "to be defined by client", pero el codigo actual ya define una paleta Mahalo y usa `public/logo2.png` como logo principal.
- El proyecto actual separa `landingImageUrl` para arte promocional del carousel y `logoUrl` para logo contenido en tarjetas de plan.
