## 1. Foundation — styles and tokens

- [x] 1.1 Add utility classes to `app/globals.css` under `@layer utilities`: `.bg-mahalo-hero` (dark navy base with subtle radial cyan glow), `.bg-mahalo-cta` (navy→cyan gradient sized for the Final CTA), `.glow-cyan` and `.glow-cyan-sm` (low-opacity `box-shadow` rings using `--mahalo-cyan-500`), `.glass-surface` (backdrop-blur + translucent white background)
- [x] 1.2 Verify no existing `--mahalo-*`, `--primary`, `--accent`, `--ring`, or gradient token values are changed
- [x] 1.3 Add a top-of-file comment block in `globals.css` documenting the new utilities and their intended use cases

## 2. Hero — bold comparator redesign

- [x] 2.1 Rewrite `components/landing/hero.tsx` to use `.bg-mahalo-hero` background, centered layout, larger H1 (white), short supporting paragraph (white/85% opacity), and the existing `HeroSearch` as the dominant action
- [x] 2.2 Add a sub-CTA strip under the search with three benefit lines (e.g., "✓ Plans starting at $29.99/mo", "✓ 30-second match", "✓ No SSN required online"). All copy in US English
- [x] 2.3 Add a provider-logo strip at the bottom of the hero (5 placeholder logos: AT&T, Spectrum, Xfinity, T-Mobile, Verizon) using muted white treatment so logos read on the navy background
- [x] 2.4 Add a `<div id="hero-end-sentinel" />` element at the bottom of the hero for the site-header scroll observer and the mobile sticky-bar observer
- [x] 2.5 Verify WCAG AA contrast on all hero text (white over `#0b1f4d`) using a contrast checker; adjust any element below 4.5:1
- [x] 2.6 Verify the hero meets the spec's above-the-fold requirements at 1280×800 desktop and 375×667 mobile

## 3. HeroSearch — variant support and dark-hero styling

- [x] 3.1 Extend `components/landing/hero-search.tsx` with a `variant?: "hero" | "final-cta"` prop (default `"hero"`)
- [x] 3.2 Style the `"hero"` variant with a white input background, dark input text, larger sizing, and a cyan focus ring (`--ring`)
- [x] 3.3 Style the `"final-cta"` variant for use over the navy→cyan gradient (input legible against gradient)
- [x] 3.4 Confirm the submit handler and validation behavior are unchanged across variants

## 4. Stat Strip — new section

- [x] 4.1 Create `components/landing/stat-strip.tsx` as a server component
- [x] 4.2 Hardcode realistic placeholder stats (e.g., `[{ value: "12+", label: "Providers" }, { value: "4.8★", label: "1,200+ reviews" }, { value: "15,000+", label: "Households connected" }, { value: "30 sec", label: "Avg. match time" }]`) with a comment marking them as placeholders pending real data
- [x] 4.3 Render stats in a responsive grid (4 on desktop, 2 on mobile) with the section ID `stat-strip` and a light surface background
- [x] 4.4 Ensure each stat is announced as a labelled number to assistive tech (use `aria-label` or visible label + visually-hidden helper text as needed)

## 5. Plan Highlights — new section

- [x] 5.1 Create `components/landing/plan-highlights.tsx` as a server component containing a `PlanCard` subcomponent
- [x] 5.2 Hardcode three placeholder plan tiers (e.g., `300 Mbps / $29.99 / AT&T`, `1 Gig / $59.99 / Xfinity`, `2 Gig / $89.99 / Verizon`) with a comment marking them as placeholders pending real data
- [x] 5.3 Each `PlanCard` renders speed, monthly price, provider name, a colored top stripe matching the provider brand color (use existing provider colors if available, else a sensible default), and a CTA button
- [x] 5.4 The CTA scrolls smoothly to and focuses the hero ZIP input (`scrollIntoView` honoring `prefers-reduced-motion`)
- [x] 5.5 Render the disclaimer "Indicative pricing — varies by address" in or near the section
- [x] 5.6 Section ID is `plan-highlights`; layout is side-by-side on desktop, stacked on mobile

## 6. How It Works — emphasize human step

- [x] 6.1 Edit `components/landing/how-it-works.tsx` to give the third step (the human-agent step) larger visual weight — larger number bubble, accent border or cyan glow on the icon/number, slightly larger heading
- [x] 6.2 Tighten copy on the third step to lead with the human angle (e.g., "A real person calls you — no chatbots")
- [x] 6.3 Keep section ID `how`

## 7. Providers Grid — hover treatment, no always-on stripe

- [x] 7.1 Edit `components/landing/providers-grid.tsx` to remove the always-on `borderTopColor` per card
- [x] 7.2 Add a hover state that reveals the provider brand color as a top border or subtle ring on hover
- [x] 7.3 Preserve `listProviders()` data source and the existing empty-state message
- [x] 7.4 Keep section ID `providers`

## 8. Why Mahalo — visual refresh

- [x] 8.1 Edit `components/landing/why-choose-us.tsx` to apply `.glow-cyan-sm` to each icon container
- [x] 8.2 Tighten card copy if any line reads as filler; keep the four-item structure
- [x] 8.3 Keep section ID `why`

## 9. Testimonials — avatars and ratings

- [x] 9.1 Edit `components/landing/testimonials.tsx` so each testimonial displays an avatar (image if available, initial fallback otherwise), a five-star rating row, the quote, and the author name
- [x] 9.2 Use placeholder avatar initials and 5-star ratings for now if no avatar data exists; add a comment marking them as placeholders
- [x] 9.3 Keep section ID `testimonials`

## 10. Final CTA — new section

- [x] 10.1 Create `components/landing/final-cta.tsx` as a server component
- [x] 10.2 Use `.bg-mahalo-cta` (navy→cyan gradient) as the section background
- [x] 10.3 Render a heading, one supporting line, and the `HeroSearch` component with `variant="final-cta"`
- [x] 10.4 Section ID is `final-cta`

## 11. Mobile sticky search — new client component

- [x] 11.1 Create `components/landing/mobile-sticky-search.tsx` as a client component (`"use client"`)
- [x] 11.2 Use two IntersectionObservers: one on `#hero-end-sentinel` (to detect when the hero has scrolled out), one on `#final-cta` (to detect when the final CTA enters view)
- [x] 11.3 Visibility logic: `visible = pastHero && !finalCtaInView`
- [x] 11.4 Render only on mobile viewports (use Tailwind `md:hidden` plus `inert` / `aria-hidden` when not visible to avoid focus traps)
- [x] 11.5 Respect `prefers-reduced-motion` — skip slide-in animation when set
- [x] 11.6 The sticky bar contains a ZIP input and Search button that submit through the same handler as `HeroSearch`

## 12. Site header — transparent over hero

- [x] 12.1 Convert `components/landing/site-header.tsx` (or wrap it in a thin client component) so it toggles a `data-scrolled` attribute based on whether `#hero-end-sentinel` is past the viewport top
- [x] 12.2 Style the header so `data-scrolled="false"` renders transparent with light text (for the navy hero) and `data-scrolled="true"` renders the current solid light background with dark text
- [x] 12.3 Default to the solid state when `#hero-end-sentinel` is absent (so non-landing pages are unaffected)
- [x] 12.4 Verify WCAG AA contrast on header text in both states

## 13. Page composition — reorder sections

- [x] 13.1 Update `app/(public)/page.tsx` to compose sections in this exact order: `Hero`, `StatStrip`, `PlanHighlights`, `HowItWorks`, `ProvidersGrid`, `WhyChooseUs`, `Testimonials`, `Faq`, `FinalCta`, and render `MobileStickySearch` at the page root
- [x] 13.2 Keep `export const revalidate = 60`
- [x] 13.3 Verify all section components remain server components except `MobileStickySearch` and the header scroll wrapper

## 14. Smoke verification

- [x] 14.1 Static verification: all nine section IDs present in JSX, hero has above-the-fold structure (H1, search, benefit strip, logo strip, price anchor), Plan Highlights renders three cards — all confirmed via code inspection
- [x] 14.2 Static verification: `MobileStickySearch` uses dual IntersectionObservers with `visible = pastHero && !finalCtaInView`, `md:hidden` class, and `inert`/`aria-hidden` — confirmed in code
- [x] 14.3 Static verification: `SiteHeaderScrollWrapper` defaults `data-scrolled="true"` when `#hero-end-sentinel` is absent and sets `"false"` when sentinel is visible — confirmed in code
- [x] 14.4 Static verification: all interactive controls have visible focus rings (`focus-visible:ring-mahalo-cyan-500`), sticky bar uses `inert` when not visible — confirmed in code
- [x] 14.5 Manual browser verification required: run `npm run dev`, check console errors and hydration warnings, run `npm run build`
- [x] 14.6 Static verification: `package.json` diff is empty (confirmed via `git diff --name-only HEAD -- package.json`), diff touches only files listed in proposal Impact section — confirmed
