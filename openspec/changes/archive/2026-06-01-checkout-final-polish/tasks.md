## 1. Dependency

- [x] 1.1 Add `canvas-confetti` and `@types/canvas-confetti` to the project (`pnpm add canvas-confetti` + `pnpm add -D @types/canvas-confetti`)

## 2. Shared SectionCard

- [x] 2.1 Create `components/checkout/section-card.tsx` exporting `SectionCard` (premium-light-card surface + decorative cyan blur + top hairline + content on a `relative` layer); no hover-lift
- [x] 2.2 Update `components/checkout/phase2-form.tsx` to import the shared `SectionCard` and remove the local copy (keep embedded billing address NOT double-carded)
- [x] 2.3 Typecheck/lint to confirm Phase 2 still renders identically

## 3. Phase 3 (schedule) unification

- [x] 3.1 Wrap the three `schedule-form.tsx` sections ("Choose a day", "Choose a time", consent) in the shared `SectionCard`, preserving the `opacity-60` disabled state of the time section when no date is selected
- [x] 3.2 Enlarge the Phase 3 "Confirm order" CTA to match Phase 1/2 (`h-12 w-full rounded-xl px-10 text-base font-semibold sm:w-auto`, `variant="primary"`, `size="lg"`)

## 4. Confirmation confetti + celebratory redesign

- [x] 4.1 Create `components/checkout/confetti-burst.tsx` (`"use client"`): on mount, if NOT `prefers-reduced-motion`, dynamically import `canvas-confetti` and fire one burst; guard against double-fire with a `useRef`
- [x] 4.2 Redesign the success branch of `app/(public)/checkout/confirmation/page.tsx`: premium card surface, circular lucide `Check` success badge, celebratory heading, prominent order-reference chip, clear next-step, primary "Back to home" action
- [x] 4.3 Mount `<ConfettiBurst />` ONLY inside the success branch (never in the error branch)
- [x] 4.4 Leave the error branch behavior intact ("We couldn't submit your order" + "Back to scheduling")

## 5. Verification

- [x] 5.1 Run typecheck + lint; confirm no errors and no SSR/`window` usage leaks into the server-rendered confirmation page (`tsc` clean; eslint clean except a pre-existing `form.watch` warning; `canvas-confetti` only imported inside the `"use client"` leaf via dynamic import)
- [ ] 5.2 Confirm Phase 3 sections render on the premium surface and the "Confirm order" CTA is enlarged — manual browser check pending
- [ ] 5.3 Confirm a successful confirmation shows the celebratory layout and a single confetti burst — manual browser check pending
- [ ] 5.4 Confirm `prefers-reduced-motion` suppresses the confetti while the success layout still renders — manual browser check pending
- [ ] 5.5 Confirm the error branch shows no confetti/celebration and keeps "Back to scheduling" — manual browser check pending
