## Why

The premium card treatment now spans Phase 1 and Phase 2 of the checkout, but the experience loses momentum at the finish line: Phase 3 (schedule) still uses the old flat sections, and the confirmation screen — the emotional peak of the purchase — is a muted, flat card. The last thing a buyer sees should feel like a win, not a receipt. This change carries the premium feel through the final form step and turns the closing screen into a celebratory success moment.

## What Changes

- Wrap the Phase 3 (schedule) sections ("Choose a day", "Choose a time", consent) in the same premium card surface used by Phase 1/2, and enlarge the Phase 3 "Confirm order" CTA to match.
- Extract the `SectionCard` component (currently local to `phase2-form.tsx`) into a shared module so Phase 2 and Phase 3 use one implementation.
- Redesign the confirmation/closing screen into an impactful success state: a large success check icon, a celebratory heading, the order reference shown as a prominent chip, a clear next-step, all on the premium card surface.
- Add a one-time **confetti** burst on the confirmation screen — success path only, gated by `prefers-reduced-motion`. Introduces a new dependency (`canvas-confetti`). Because the page is a Server Component, a small client leaf fires the effect.
- The confirmation **error branch** keeps its current behavior and does NOT celebrate.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `checkout-wizard`: extend the premium-card-surface requirement to also cover Phase 3 sections; confirm the prominent-CTA requirement covers Phase 3's "Confirm order"; and add a requirement that the closing screen is a celebratory success state with a one-time, reduced-motion-aware confetti burst on success only (never on error).

## Impact

- **Dependencies:** add `canvas-confetti` and `@types/canvas-confetti` to `package.json`.
- **New files:** `components/checkout/section-card.tsx` (shared premium surface), `components/checkout/confetti-burst.tsx` (client leaf firing `canvas-confetti` on mount, reduced-motion-aware).
- **`components/checkout/phase2-form.tsx`:** import the shared `SectionCard`, remove the local copy.
- **`components/checkout/schedule-form.tsx`:** wrap the three sections in `SectionCard`; enlarge the "Confirm order" CTA (`h-12`, full-width on mobile). Disabled state of the schedule sections (`opacity-60` when no date) is preserved.
- **`app/(public)/checkout/confirmation/page.tsx`:** redesigned success card (premium surface, lucide-react success icon, prominent reference chip, next-step) and mount `ConfettiBurst` only on the success path; error branch behavior unchanged.
- **Reuse:** existing `premium-light-card` utility (`app/globals.css`) and `lucide-react`.
- **Out of scope:** payment processing, copy/legal changes, and any DB or server-action changes.
