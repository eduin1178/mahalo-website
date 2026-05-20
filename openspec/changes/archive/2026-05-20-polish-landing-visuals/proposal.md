## Why

The current landing redesign already has a strong conversion structure, but several visual surfaces still feel less polished than the brand direction now requires. The logo treatment, plan cards, steps section, and testimonials need a more premium editorial finish while preserving the existing funnel, accessibility, and server-first rendering model.

## What Changes

- Add an explicit rounded logo surface variant for public header/footer usage so the white logo asset looks intentional while scrolling over light and dark sections.
- Upgrade the Plan Highlights section with a professional image-backed background, strong overlay treatment, premium glass-like plan cards, provider accents, and CSS/Tailwind-only motion using existing `tw-animate-css` capabilities.
- Add a contextual visual treatment to the How It Works section that reinforces the three-step flow and the human-agent differentiator.
- Refresh the Testimonials section with an inverse gradient relative to the Final CTA, preserving trust/readability while making the section feel more premium.
- Keep animation restrained and accessible: entrance, hover, focus, and transition effects only; no Remotion, no Framer Motion, no new runtime animation dependency.
- Preserve the existing checkout/search behavior, section order, landing copy language, provider data sources, and placeholder plan disclaimer.

## Capabilities

### New Capabilities
<!-- None. This is a refinement of the existing public landing capability, not a new user-facing domain capability. -->

### Modified Capabilities
- `public-landing`: Refine landing visual requirements for logo surface treatment, premium image-backed plan highlights, contextual how-it-works imagery, inverse-gradient testimonials, and CSS/Tailwind-only animation.

## Impact

- **Affected code**:
  - `components/brand/Logo.tsx` — add a public logo surface variant without globally changing all logo usages.
  - `components/landing/site-header.tsx` — use the new logo surface variant in the public header.
  - `components/landing/site-footer.tsx` — use the new logo surface variant in the public footer.
  - `components/landing/plan-highlights.tsx` — premium image-backed section and animated plan card treatment.
  - `components/landing/how-it-works.tsx` — add contextual visual/image treatment around the steps.
  - `components/landing/testimonials.tsx` — inverse-gradient trust section and premium card treatment.
  - `app/globals.css` — additive utilities only for animation, glass, overlays, or section gradients if needed.
  - `public/**` — possible new static image assets for plan highlights and how-it-works visuals.
- **Dependencies**: No new npm packages. Use existing Tailwind v4 and `tw-animate-css`.
- **Data**: No database, Drizzle, provider, plan-query, checkout, Clerk, Resend, n8n, Docker, or address-validation changes.
- **Accessibility**: All text over imagery/gradients must maintain WCAG AA contrast; motion must respect `prefers-reduced-motion`.
