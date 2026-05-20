## Context

The public landing page already follows the prior bold-comparator redesign: dark hero, stat strip, plan highlights, how-it-works, providers, why, testimonials, FAQ, final CTA, and mobile sticky search. The current request is not another structural rebuild; it is a visual polish pass focused on surfaces that still feel less premium: the logo over scrolling backgrounds, plan cards, the steps section, and the testimonials section.

Current constraints remain important:
- Next.js 16 App Router and Tailwind v4.
- Existing `tw-animate-css` is available through `app/globals.css`.
- No new npm dependencies.
- Public landing copy stays in US English and internet-only.
- Existing Mahalo brand tokens remain unchanged.
- Checkout, admin, provider/plan data, address lookup, Clerk, Resend, n8n, Docker, and database layers are out of scope.
- The project rule says never build after changes; verification must avoid `next build` unless the user explicitly changes that constraint.

## Goals / Non-Goals

**Goals:**
- Make the public landing feel more premium/pro without changing the conversion architecture.
- Add an explicit logo surface variant for public header/footer contexts so the white logo background looks intentional while scrolling.
- Give Plan Highlights a stronger editorial background image treatment, high-legibility overlay, and animated premium cards.
- Add a contextual visual to How It Works that supports the three-step story and the human-agent differentiator.
- Give Testimonials an inverse-gradient treatment relative to the Final CTA while preserving calm trust/readability.
- Use CSS/Tailwind and `tw-animate-css` only for animation.

**Non-Goals:**
- No Remotion runtime usage for landing UI animation.
- No Framer Motion, GSAP, Lottie, or new animation package.
- No live-data wiring for placeholder plan cards or testimonials.
- No section reorder beyond the existing prescribed order.
- No changes to the address lookup/search behavior.
- No checkout, admin, database, auth, email, n8n, Docker, or deployment changes.

## Decisions

### D1 — Logo treatment uses an explicit variant, not a global class change

**Decision:** Extend `Logo` with a public surface-style variant, then opt into it from the public header and footer. The base/default logo rendering remains unchanged.

**Why:** The issue is contextual: the PNG has a white visual field that looks awkward over scroll states. Applying rounded/padded styling globally would risk unintended changes in admin, style guide, or future brand placements.

**Alternatives considered:**
- Add `rounded-*` to every `Logo` image globally. Rejected because it changes all logo contexts.
- Wrap each public logo manually. Rejected because it duplicates surface styling.
- Edit the source image. Deferred because code-level treatment is faster and reversible.

### D2 — Plan Highlights becomes image-backed, but readability wins over decoration

**Decision:** Add a background image to the Plan Highlights section with a strong navy/blue overlay and keep the cards on a high-contrast surface (`glass`, white, or near-white depending on final composition). Card content—speed, price, provider, CTA—must remain visually dominant.

**Why:** A background image can create the requested professional feel, but pricing cards are conversion-critical. The image must support the card hierarchy, not compete with it.

**Alternatives considered:**
- Full-bright lifestyle photo with minimal overlay. Rejected due to contrast/readability risk.
- Pure abstract gradient only. Rejected because the user explicitly wants imagery.
- Inline remote image from Unsplash/Pexels. Rejected for production reliability; prefer a checked-in optimized asset under `public/` once selected/generated.

### D3 — Animation stays CSS/Tailwind-only and purposeful

**Decision:** Use existing Tailwind utilities and `tw-animate-css` for small entrance, hover, focus, and transition effects. Motion must respect `prefers-reduced-motion` via Tailwind `motion-safe:` / `motion-reduce:` utilities or equivalent CSS.

**Why:** The user approved CSS/Tailwind + `tw-animate-css`. This avoids adding runtime animation dependencies and keeps the marketing page lightweight.

**Alternatives considered:**
- Remotion for UI animation. Rejected because Remotion renders video assets; it is the wrong abstraction for interactive landing UI.
- Framer Motion/GSAP. Rejected because they add dependency and complexity for effects that CSS can handle.
- Infinite decorative animation. Rejected because it can distract from price/CTA and creates accessibility risk.

### D4 — How It Works gets a contextual visual, not generic decoration

**Decision:** Add a visual/image treatment that maps to the three-step journey: address lookup, plan comparison, and real human follow-up. The visual should reinforce the human-agent differentiator rather than generic “internet” imagery.

**Why:** This section explains the operating model. A contextual visual reduces cognitive load and makes the human step more memorable.

**Alternatives considered:**
- Generic router/fiber image. Rejected as too generic.
- Three separate images, one per step. Deferred because it may add visual noise.
- Pure icons only. Current treatment is already close to that and needs more editorial weight.

### D5 — Testimonials uses an inverse CTA gradient, but remains calm

**Decision:** Apply a gradient direction/tone that visually opposes the Final CTA, with premium testimonial cards layered above it. The section should feel trustworthy and polished, not loud.

**Why:** Testimonials are trust-building content. The gradient can create momentum toward the CTA, but quotes must stay highly readable.

**Alternatives considered:**
- Reuse `bg-mahalo-cta`. Rejected because it would make Testimonials and Final CTA feel repetitive.
- Keep plain white background. Rejected because it does not satisfy the requested polish level.
- Dominant cyan background. Rejected because prior brand constraints keep cyan as an accent, not the dominant full-section surface.

## Risks / Trade-offs

- **[Background imagery hurts contrast]** → Use strong overlays, test text/card contrast, and prefer card surfaces that isolate content from the image.
- **[Animations feel cheap]** → Keep motion short, subtle, and tied to interaction/entry; avoid infinite pulses and large parallax.
- **[Logo variant leaks into admin]** → Make the new logo treatment opt-in and update only public header/footer usages.
- **[Remote image licensing/reliability]** → Prefer generated or downloaded/check-in assets under `public/` with stable filenames; document source if external.
- **[Motion accessibility regression]** → Use `motion-safe`/`motion-reduce` patterns and keep all hover effects non-essential.
- **[Scope creep into another landing redesign]** → Do not reorder sections, rewrite funnel logic, or touch data flows.

## Migration Plan

1. Add/adjust additive CSS utilities if needed for premium overlays, inverse gradient, and card motion.
2. Add the `Logo` surface variant and opt into it from public header/footer.
3. Add stable image assets under `public/` or use existing assets if suitable.
4. Polish `PlanHighlights`, `HowItWorks`, and `Testimonials` in place.
5. Verify visually in local dev across desktop/mobile. Do not run a production build because project instructions say never build after changes.

Rollback: revert the change. No schema, data, environment, or dependency migration is involved.

## Open Questions

- Which exact image source should be used for Plan Highlights: generated asset, Unsplash/Pexels downloaded asset, or an existing brand asset?
- Should the How It Works visual be a photo, generated illustration, or CSS/composed UI mockup?
- Should the logo surface variant be named `surface`, `publicSurface`, or `roundedSurface`? Default recommendation: `surface` because the visual treatment describes the surface, not only the border radius.


## Follow-up decisions after first visual review

### D6 ? Navbar owns the logo background; logo stays unstyled

**Decision:** Remove the rounded/bordered logo treatment from public header/footer and make the navbar a solid white surface matching the logo asset background. The logo remains clean; the surrounding navbar provides the visual context.

**Why:** This fixes the root visual problem. The earlier logo surface variant solved the symptom, but the better architectural treatment is to make the navigation surface consistent with the logo asset.

### D7 ? Plan cards remove provider top border and use stronger interaction motion

**Decision:** Remove the provider-colored top border from Plan Highlights cards. Keep provider color only as subtle contextual accent and make hover/focus motion slightly stronger while still respecting reduced motion.

**Why:** The cards looked more premium without the top color stripe. Stronger hover/entry motion adds polish without becoming noisy.

### D8 ? How It Works uses local vertical step images per step

**Decision:** Replace the generated/composed steps visual with one local 3:4 vertical image per step from `public/landing/steps`. Hover/focus on a step changes the preview image.

**Why:** The user supplied the final step imagery as local assets. Using checked-in files removes remote image dependency and lets the visual container be tuned to the assets' portrait composition.

### D9 ? Providers become a 3-visible auto carousel with manual controls

**Decision:** Replace the static providers grid with a client carousel that shows three provider cards, auto-advances in an infinite loop, and exposes previous/next controls. The section receives a soft gradient background.

**Why:** Provider cards are brand/trust content; motion makes the section feel alive and more premium while keeping user control.
