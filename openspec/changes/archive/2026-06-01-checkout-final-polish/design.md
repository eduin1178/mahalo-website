## Context

The `provider-card-logos` change introduced a premium card surface (`premium-light-card` + decorative cyan blur + top hairline) and an enlarged primary CTA across Phase 1 and Phase 2 of the checkout. The `SectionCard` wrapper that encapsulates that surface currently lives **locally** inside `components/checkout/phase2-form.tsx`. Phase 3 (`schedule-form.tsx`) still uses the old flat `rounded-xl border bg-background p-5` sections, and the confirmation page (`app/(public)/checkout/confirmation/page.tsx`, a Server Component) renders a muted success card. No animation library is installed; `lucide-react` is available.

## Goals / Non-Goals

**Goals:**

- Visual consistency: Phase 3 sections use the same premium surface; "Confirm order" CTA matches the enlarged primary button.
- One shared `SectionCard` implementation reused by Phase 2 and Phase 3.
- A confirmation screen that feels like a win: success icon, celebratory heading, prominent reference, clear next-step, premium surface.
- A tasteful, accessible confetti burst on success.

**Non-Goals:**

- No changes to scheduling logic, consent capture, order submission, or any server action / DB.
- No copy/legal wording changes (reuse existing strings; new strings are presentational only).
- Confetti is not configurable/persisted; it is a one-shot visual.

## Decisions

### Decision: Extract `SectionCard` to a shared module

Move `SectionCard` (and its `SectionDecor` bits) from `phase2-form.tsx` to `components/checkout/section-card.tsx`, exported for reuse. Phase 2 imports it (deleting the local copy); Phase 3 imports it. This avoids a second divergent copy and keeps the premium surface defined once.

- **Alternative — copy the markup into schedule-form:** rejected; duplicates the decorative structure and invites drift.

### Decision: `canvas-confetti` via a client leaf, page stays server-rendered

The confirmation page is a Server Component that reads the order and may run `submitOrder()`. Keep it server-rendered and add a tiny client component `components/checkout/confetti-burst.tsx` (`"use client"`) that, in a mount `useEffect`, dynamically imports `canvas-confetti` and fires one burst. Rendering `<ConfettiBurst />` only inside the success branch guarantees the effect never runs on the error branch.

- **Accessibility:** the effect checks `window.matchMedia("(prefers-reduced-motion: reduce)").matches` and returns early (no burst) when reduced motion is requested — mirrors the pattern already used in `plan-highlights.tsx` / the carousel.
- **One-shot:** the effect runs once on mount (empty dependency array); a `useRef` guard prevents a double-fire under React Strict Mode in dev.
- **Alternative — react-confetti:** rejected; needs width/height wiring and a persistent canvas. `canvas-confetti` is imperative, ~6KB, fire-and-forget.

### Decision: Confirmation layout

Render on the premium surface (reuse `SectionCard` or the `premium-light-card` utility directly). Compose: a circular success badge with a lucide `Check` icon (success/brand color), an `h1` celebratory heading, the order reference in a prominent monospace chip, the existing next-step copy, and the "Back to home" action (primary, to match the new CTA weight). The error branch keeps its current flat layout and "Back to scheduling" recovery.

## Risks / Trade-offs

- **Bundle/runtime cost of confetti** → `canvas-confetti` is ~6KB and dynamically imported only on the confirmation route, so it does not affect earlier steps. Mitigation: dynamic import inside the client leaf.
- **SSR safety** → `canvas-confetti` touches `window`/`document`; importing it at module top in a Server Component would break the build. Mitigation: it lives only in a `"use client"` leaf and is imported inside `useEffect`.
- **Strict-mode double-invoke in dev** → could fire twice. Mitigation: `useRef` "hasFired" guard.
- **Refactor regression** → moving `SectionCard` could break Phase 2 if the import is missed. Mitigation: typecheck + lint; Phase 2 visual parity is unchanged (same component).

## Migration Plan

1. Add `canvas-confetti` + `@types/canvas-confetti`.
2. Create shared `SectionCard`; repoint Phase 2 to it.
3. Apply `SectionCard` to Phase 3 + enlarge its CTA.
4. Create `ConfettiBurst` client leaf; redesign confirmation success card and mount the burst on success only.
5. Rollback: purely presentational + one dependency; reverting the files and removing the dependency fully reverts the change.

## Open Questions

- None blocking. (Optional later: confetti color palette tuned to brand tokens; a subtle scale-in animation on the success badge.)
