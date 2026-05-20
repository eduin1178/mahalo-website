## Why

The current public landing page (`app/(public)/page.tsx`) is visually understated and fails to communicate Mahalo's value with the impact expected in the US ISP market. It buries the address-search action, never shows speeds or prices above the fold, lacks social proof, and underuses the brand's navy + cyan palette. Competitors in the same space (Xfinity, Verizon Fios, AT&T Fiber, T-Mobile Home Internet, Spectrum) lead with bold hero stats, prominent ZIP search, and trust signals — Mahalo currently leads with a soft gradient and a single search field. This rework brings the landing up to the impact level the brand needs while keeping Mahalo's human-concierge differentiator visible.

## What Changes

- **Redesign the public landing hero** to a dark navy background with moderate cyan glow accents, a dominant ZIP/address search, a sub-CTA strip with three benefits, a price anchor ("Plans starting at $X.99/mo"), and a provider-logo strip.
- **Reorder landing sections** to: Hero → Stat strip → Plan highlights → How it works → Providers → Why Mahalo → Testimonials → FAQ → Final CTA. The current order leads with reasons before showing value; the new order leads with price and availability, then explains.
- **Add a Stat strip section** with social-proof numbers (providers count, rating, households served). Realistic placeholder data; real data plugged in later.
- **Add a Plan Highlights section** with three plan cards (e.g., 300 Mbps / 1 Gig / 2 Gig) showing price anchors and provider-color stripes. Placeholder data with an indicative-price disclaimer.
- **Add a Final CTA section** with a navy→cyan gradient and a repeated ZIP search, plus a sticky bottom ZIP-search bar on mobile.
- **Refresh existing sections** (Why Mahalo, How it works, Providers grid, Testimonials) with stronger visual hierarchy, cyan icon glows, avatars and ratings on testimonials, and grouped provider cards with hover states.
- **Extend `app/globals.css`** with utility classes for glow effects, glass surfaces, and dark-hero backgrounds. The brand palette tokens (navy 900/700, blue 600, cyan 500/300) and gradients stay; we only add helpers on top.
- **Keep the entire landing in English** (US market). No Spanish copy on this page. The redesign is internet-only — Mahalo also sells mobile plans and streaming TV, but those stay out of this landing.
- **No changes** to the checkout flow, admin panel, address validation, provider/plan data model, or auth.

## Capabilities

### New Capabilities
- `public-landing`: Public-facing landing page (`/`) that markets Mahalo's internet-comparator service to anonymous US visitors and funnels them into the address-based search flow. Covers visual hierarchy, content sections, trust signals, price anchoring, and mobile conversion patterns.

### Modified Capabilities
<!-- None — no existing specs in openspec/specs/ that govern landing behavior. -->

## Impact

- **Affected code**:
  - `app/(public)/page.tsx` — section composition and order
  - `components/landing/hero.tsx` — full redesign
  - `components/landing/hero-search.tsx` — visual prominence, may extend props for variant (hero / final-cta)
  - `components/landing/why-choose-us.tsx` — visual refresh (icon glow, copy tweaks)
  - `components/landing/providers-grid.tsx` — visual refresh (hover, grouping, no top border)
  - `components/landing/how-it-works.tsx` — visual refresh, emphasize human-agent step
  - `components/landing/testimonials.tsx` — avatars and ratings
  - `components/landing/faq.tsx` — light visual refresh only
  - `components/landing/site-header.tsx` — adapt for dark hero (transparent over hero, solid on scroll) if needed
  - `app/globals.css` — new utility classes (glow, glass, dark-hero bg)
  - **New files**: `components/landing/stat-strip.tsx`, `components/landing/plan-highlights.tsx`, `components/landing/final-cta.tsx`, `components/landing/mobile-sticky-search.tsx`
- **Dependencies**: No new npm packages required. Uses existing Tailwind v4, shadcn/ui, lucide-react, next/image.
- **Data**: Plan Highlights and Stat Strip use hardcoded placeholder content for this change; a follow-up change will wire them to real data via `lib/plans/queries` and a stats source.
- **No impact** on: database schema, Drizzle migrations, Clerk auth, USPS address validation, Resend emails, n8n webhook, Docker setup, checkout flow, admin panel.
- **Performance**: Hero and new sections must remain static / RSC-friendly. `export const revalidate = 60` on the page stays.
- **Accessibility**: Dark hero requires WCAG AA contrast checks for body copy on navy; ZIP input must keep visible focus ring on dark background; sticky mobile bar must not trap focus.
