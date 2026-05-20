## Context

The public landing page (`app/(public)/page.tsx`) composes six section components (`Hero`, `WhyChooseUs`, `ProvidersGrid`, `HowItWorks`, `Faq`, `Testimonials`). It is a server component with `revalidate = 60`. Styling uses Tailwind v4 with custom Mahalo tokens in `app/globals.css` (`--mahalo-navy-900/700`, `--mahalo-blue-600`, `--mahalo-cyan-500/300`, `--mahalo-gradient`, `--mahalo-gradient-soft`).

The current visual treatment is intentionally soft (light gradient hero, neutral grids). User feedback is that it lacks impact for the US ISP market, where competitors (Xfinity, Verizon Fios, AT&T Fiber, T-Mobile Home Internet, Spectrum) lead with bold hero stats, dominant ZIP search, and trust signals. Mahalo's brand palette is already well-suited for a darker, more electric hero — the cyan accent is just underused.

Constraints:
- No new npm dependencies.
- Internet-only scope on this landing (Mahalo also sells mobile and TV elsewhere).
- All copy in US English.
- Server-rendered (RSC) where possible; client components only where interactivity demands.
- Existing brand tokens must not change values.
- WCAG AA contrast on the new dark hero.
- The existing checkout, admin, address validation, and data layer must not be touched.

Stakeholders: Mahalo Enterprise (brand owner), end visitors (anonymous US households shopping for internet), the agent team (downstream — receives leads from the same address-lookup flow).

## Goals / Non-Goals

**Goals:**
- Deliver a hero that communicates value within 2 seconds: bold headline, dominant ZIP search, price anchor, trust strip.
- Reorder sections so the visitor sees prices and providers before reasons.
- Add three new sections (Stat Strip, Plan Highlights, Final CTA) that follow the US ISP playbook without breaking Mahalo's human-concierge differentiator.
- Refresh existing sections (Why, Providers, How, Testimonials) visually while preserving their data sources and semantics.
- Introduce a mobile sticky search bar that drives conversion on the smallest viewports.
- Extend the brand system through additive utility classes only (glow, glass, dark-hero), never by mutating existing tokens.
- Keep the rendering model server-first to preserve `revalidate = 60` and avoid hydration cost on what is essentially marketing content.

**Non-Goals:**
- Wiring Plan Highlights or Stat Strip to live data (follow-up change).
- Adding mobile-plan, voice, or streaming-TV content to this landing.
- Internationalization / Spanish version of the landing.
- Redesigning the site header beyond the transparent-over-hero adaptation, or redesigning the site footer.
- Changing the address-validation flow or any downstream checkout step.
- Adding analytics or A/B-testing infrastructure (can be a follow-up).
- Adding animations beyond subtle CSS transitions (no Framer Motion, no Lottie).

## Decisions

### D1 — Hero direction: hybrid "Bold Comparator" + "Human Concierge"

**Decision:** Hero adopts the "Bold Comparator" pattern (dark navy background, moderate cyan glow, dominant centered ZIP search, three-benefit sub-CTA, price anchor, provider-logo strip). The "Human Concierge" angle is preserved in downstream sections (How It Works step 3 emphasized, Why Mahalo "real person" card, Testimonials with avatars).

**Alternatives considered:**
- **Pure Bold Comparator (Xfinity/Verizon clone):** maximum impact, but erases Mahalo's differentiator (humans, not bots). Rejected.
- **Pure Friendly Concierge (illustration-led):** preserves differentiator but doesn't deliver the "wow" the user asked for. Rejected.
- **Editorial Premium (Apple-like, minimal):** beautiful but doesn't surface price/availability anchors that US ISP visitors expect. Rejected.

**Why hybrid:** the hero buys attention (Comparator), the body sections close the deal (Concierge). This matches the user's explicit choice and Mahalo's positioning between the big-box ISPs and the boutique consultants.

### D2 — Section order: lead with value, then reasons

**Decision:** New order — `Hero → Stat Strip → Plan Highlights → How It Works → Providers Grid → Why Mahalo → Testimonials → FAQ → Final CTA`.

**Alternatives considered:**
- Keep current order (`Hero → Why → Providers → How → FAQ → Testimonials`). Rejected — reasons-before-prices buries the value.
- Move FAQ before Testimonials. Rejected — Testimonials are a stronger transition into the Final CTA than FAQ.
- Put Providers Grid before Plan Highlights. Rejected — Plan Highlights anchor expectations with concrete numbers; the provider grid is identity, not value.

### D3 — Implementation: new section components, no monoliths

**Decision:** Each new section is its own file under `components/landing/`:
- `stat-strip.tsx` (server component, hardcoded data array)
- `plan-highlights.tsx` (server component, hardcoded data array, includes a `PlanCard` subcomponent)
- `final-cta.tsx` (server component, composes `HeroSearch` with a `variant="final-cta"` prop)
- `mobile-sticky-search.tsx` (client component — needs scroll listener and IntersectionObserver for the Final CTA collision-hide)

Existing sections are edited in place — no rename, no extraction beyond what's necessary.

**Alternatives considered:**
- One mega `LandingSections` component. Rejected — kills tree-shaking and reviewability.
- Pull section data into MDX or a CMS. Rejected — out of scope, no CMS in the stack.
- Make every section a client component for parallax/animations. Rejected — RSC-first, no animation libraries (non-goal).

### D4 — Hero variant of `HeroSearch`, not a duplicate

**Decision:** Extend `HeroSearch` with a `variant?: "hero" | "final-cta"` prop. The hero variant uses larger spacing and a white input on dark; the final-cta variant uses the gradient background context. Keep one component, one submit handler, one validation behavior.

**Alternatives considered:**
- Duplicate the search into a `FinalCtaSearch`. Rejected — divergence risk on submit logic.
- Move the search to a `SearchProvider` context. Rejected — overkill for two callsites.

### D5 — Mobile sticky bar: client component with IntersectionObserver

**Decision:** `mobile-sticky-search.tsx` is a client component that:
1. Uses an `IntersectionObserver` on a `#hero-end-sentinel` to know when the hero has scrolled out, and on a `#final-cta` to know when the final CTA enters view.
2. Sets visibility via `visible = pastHero && !finalCtaInView`.
3. Renders only when `window.matchMedia("(max-width: 767px)")` matches (or via Tailwind `md:hidden`).
4. Uses `inert` / `aria-hidden` when not visible so it never traps focus.

**Alternatives considered:**
- Scroll-event listener. Rejected — IntersectionObserver is the standard, cheaper option.
- Always-visible mobile bar. Rejected — duplicates the hero search on first paint and feels pushy.
- CSS-only (`position: sticky`). Rejected — can't collide-hide with the Final CTA.

### D6 — Brand system extension: additive utilities only

**Decision:** Add new classes under `@layer utilities` in `app/globals.css`:
- `.bg-mahalo-hero` — dark navy base with a subtle radial cyan glow (CSS gradient, no image).
- `.glow-cyan` / `.glow-cyan-sm` — `box-shadow` rings using `--mahalo-cyan-500` at low opacity, for icon halos and focus emphasis on dark backgrounds.
- `.glass-surface` — `backdrop-filter: blur(...)` with semi-transparent white background, for cards over the dark hero.
- `.bg-mahalo-cta` — navy→cyan gradient sized for the Final CTA.

Existing tokens (`--mahalo-*`, `--primary`, `--accent`, etc.) keep their values. The dark hero treatment uses existing `--mahalo-navy-900`; the cyan glow uses existing `--mahalo-cyan-500`.

**Alternatives considered:**
- Introduce a `dark` color scheme via `:root.dark` and toggle on the hero. Rejected — the rest of the page stays light; this would scope-creep into a real dark mode.
- Embed gradients as inline styles. Rejected — utilities are reusable and overridable.

### D7 — Site header adaptation: client component with scroll state

**Decision:** `site-header.tsx` becomes client-aware (or a thin client wrapper around the existing server header) that toggles a `data-scrolled` attribute on scroll. CSS handles the visual switch (transparent + light text → solid + dark text). The hero exposes a `#hero-end-sentinel` element so an IntersectionObserver decides "past hero".

**Alternatives considered:**
- Pure CSS `@supports` / `scroll-driven animations`. Rejected — uneven browser support in 2026 still; we have Tailwind v4 and JS is fine.
- Always-solid header. Rejected — wastes hero impact and feels dated.

### D8 — Placeholder data: realistic, marked, single source

**Decision:** Plan Highlights and Stat Strip data live as plain TypeScript constants at the top of their respective files, with a code comment marking them as placeholders awaiting real data. Plan Highlights renders a visible disclaimer "Indicative pricing — varies by address". Stat Strip values are realistic round numbers (e.g., "12+ providers", "4.8★ (1,200+ reviews)", "15,000+ households"). The follow-up change will replace these constants with `lib/plans/queries` calls and a stats source.

**Alternatives considered:**
- Random/Faker data per render. Rejected — non-deterministic, breaks `revalidate = 60` caching expectations.
- Pull from a JSON file at the repo root. Rejected — extra indirection for zero gain.

### D9 — Accessibility: contrast, focus, motion

**Decision:**
- All body copy on the dark hero uses pure white or `rgba(255,255,255,0.85)` minimum to meet AA 4.5:1 over `#0b1f4d`.
- The ZIP input on the dark hero uses a white background with dark text — no light-on-light states.
- Focus rings use `--ring` (`--mahalo-cyan-500`), which gives 3:1 over the navy hero.
- The sticky mobile bar respects `prefers-reduced-motion` (no slide-in animation when set).
- Cyan glow uses `box-shadow` of `< 20px` blur with low opacity — no flashing, no animation.

**Alternatives considered:**
- Animated cyan pulse on hero CTA. Rejected — accessibility risk for motion-sensitive visitors.

### D10 — Testing strategy: visual review + unit smoke

**Decision:** Implementation runs in dev mode (`npm run dev`) and is verified by loading `/` in a desktop and mobile viewport, plus a screenshot pass. A minimal smoke test asserts that the page renders all expected section IDs (`#hero`, `#stat-strip`, `#plan-highlights`, `#how`, `#providers`, `#why`, `#testimonials`, `#faq`, `#final-cta`) and that `Plan Highlights` renders three cards. No new heavyweight test infra is added.

**Alternatives considered:**
- Visual regression snapshots (Percy/Chromatic). Rejected — out of scope, no infra in repo.
- Playwright E2E for the sticky bar. Deferred — manual verification is acceptable for this change; can be added in a follow-up if needed.

## Risks / Trade-offs

- **[Contrast regressions on the dark hero]** → Verify each text element against `#0b1f4d` with a contrast tool during implementation; if any element falls below AA, switch to `#ffffff` or add a `text-shadow` only as last resort.
- **[Placeholder data feels like a stub]** → Use realistic numbers and visible "indicative pricing" disclaimer; document in proposal that real data is a follow-up.
- **[Sticky mobile bar covering important content]** → Use IntersectionObserver collision-hide for the Final CTA; ensure footer has bottom padding equal to the sticky bar height.
- **[Header transparent state breaks on pages that aren't the landing]** → Header logic must check whether a `#hero-end-sentinel` exists on the current route; if absent, default to the solid state. Keeps all admin/checkout pages unaffected.
- **[New utilities collide with future shadcn updates]** → Namespace utilities with `mahalo-` prefix or under unambiguous names (`glow-cyan`, `glass-surface`); document in a comment block in `globals.css`.
- **[Plan Highlights CTAs that scroll to top])** → Use `scrollIntoView({ behavior: "smooth" })` honoring `prefers-reduced-motion`; ensure the hero ZIP input receives focus after scroll for keyboard users.
- **[Provider grid losing the per-card brand stripe might dull provider identity]** → Keep brand color present via hover state (`border-top` colored on hover) and the Plan Highlights card stripes, so brand identity stays visible without the always-on stripe.

## Migration Plan

This is a UI redesign with no data migration. Deployment:

1. Implement the change behind the normal preview/PR flow.
2. Merge to `master` — Dokploy redeploys the Next.js app.
3. No DB migrations, no env changes, no third-party config.

Rollback: revert the merge commit. Because no schema or external integrations change, rollback is a single git revert + redeploy.

## Open Questions

- Should the Plan Highlights cards link to provider-specific deep links (e.g., a pre-filtered plan view) or only act as scroll-to-hero CTAs? **Default for this change:** scroll-to-hero. A follow-up can wire deep links once the plans query is connected.
- Should the Final CTA also include a phone number / "Talk to an agent" option? **Default for this change:** no — keeps the funnel single-channel (address search). Revisit after first launch data.
- Should the mobile sticky bar collapse when the visitor scrolls UP (versus only collision-hiding with the Final CTA)? **Default for this change:** no scroll-direction logic; only collision-hide. Simpler, fewer edge cases.
