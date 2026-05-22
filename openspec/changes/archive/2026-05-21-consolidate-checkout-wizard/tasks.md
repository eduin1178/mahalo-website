## 1. Stepper and shared layout

- [x] 1.1 Rewrite `components/checkout/stepper.tsx` to render exactly three chips (`Plan`, `Datos`, `Instalación`) with active/done/todo states resolved from pathname.
- [x] 1.2 Update `app/(public)/checkout/layout.tsx` to host the new stepper and reserve grid space for the persistent total panel on `lg+` viewports.
- [x] 1.3 Remove the `Step N of 8` eyebrows from all checkout pages that will remain (`/checkout/plan`, `/checkout/details`, `/checkout/schedule`) and replace with phase titles in neutral Spanish.

## 2. OrderTotalPanel (persistent cost panel)

- [x] 2.1 Create `components/checkout/order-total-panel.tsx` as a Server Component that reads the current draft and calls `calculateTotal()` only when `providerId && planId` are present, otherwise renders the "Elige un plan para ver el total" placeholder.
- [x] 2.2 Implement desktop layout: render as right sidebar inside the checkout layout grid on `lg+`.
- [x] 2.3 Implement mobile layout: render as sticky bottom bar with expand/collapse interaction (Client Component wrapper for toggle state).
- [x] 2.4 Wire the panel into the layout so it appears on Phase 1, Phase 2, and Phase 3 but is hidden on `/checkout` (bootstrap) and `/checkout/confirmation`.

## 3. Phase 1 — Plan + Add-ons consolidation

- [x] 3.1 Refactor `app/(public)/checkout/plan/page.tsx` to render the plan list and, when a plan is selected, conditionally render the add-ons form below using the existing `add-ons-form.tsx`.
- [x] 3.2 Compose `components/checkout/plan-card.tsx` and `add-ons-form.tsx` into a single client-side flow where selecting a plan reveals the add-ons section without navigation.
- [x] 3.3 Replace the existing "next" navigation in `add-ons-form.tsx` with a unified "Continuar" CTA on the page that validates plan selection and persists both plan and add-ons before redirecting to `/checkout/details`.
- [x] 3.4 Ensure that providers without active add-ons simply hide the add-ons section (no redirect, no flash).
- [x] 3.5 Translate all copy in Phase 1 (titles, helper text, CTA, validation messages) to neutral Spanish with "tú".

## 4. Phase 2 — Customer + Payment consolidation

- [x] 4.1 Create `app/(public)/checkout/details/page.tsx` as a Server Component that reads the draft, fetches the existing customer record (if any), and renders the combined view.
- [x] 4.2 Build the combined view with four clearly delimited sections: Contacto, Dirección de instalación, Dirección de facturación, Preferencia de pago. Reuse internal field groups from `customer-form.tsx` and `payment-form.tsx`.
- [x] 4.3 Implement single "Continuar" CTA that runs unified validation across all sections; on error, scroll to the first invalid section and render inline messages.
- [x] 4.4 Persist all collected data in one server action call: upsert customer, store payment preference, then redirect to `/checkout/schedule`.
- [x] 4.5 Handle the partial-draft case where `customerId` exists but `paymentData` does not: pre-fill customer sections, leave payment section empty without blocking.
- [x] 4.6 Translate all copy in Phase 2 to neutral Spanish with "tú".

## 5. Phase 3 — Schedule + final review consolidation

- [x] 5.1 Refactor `app/(public)/checkout/schedule/page.tsx` to render the date/time picker followed by a read-only consolidated summary (plan, add-ons, customer, addresses, total breakdown).
- [x] 5.2 Add "Editar" affordances next to each summary section that navigate back to the corresponding earlier phase.
- [x] 5.3 Replace the existing CTA with "Confirmar pedido"; on submit, call the existing `submitOrder()` server action and redirect to `/checkout/confirmation`.
- [x] 5.4 Translate all copy in Phase 3 to neutral Spanish with "tú".

## 6. Legacy URL redirects

- [x] 6.1 Add `app/(public)/checkout/add-ons/page.tsx` as a tiny Server Component that redirects 302 to `/checkout/plan` preserving the draft.
- [x] 6.2 Add `app/(public)/checkout/summary/page.tsx` redirecting 302 based on draft state (to `/checkout/plan`, `/checkout/details`, or `/checkout/schedule` depending on what's completed).
- [x] 6.3 Add `app/(public)/checkout/customer/page.tsx` redirecting 302 to `/checkout/details`.
- [x] 6.4 Add `app/(public)/checkout/payment/page.tsx` redirecting 302 to `/checkout/details`.
- [x] 6.5 Verify all four redirects preserve the draft cookie and do not break when no draft exists (fall back to `/`).

## 7. Navigation guards

- [x] 7.1 Ensure `/checkout/plan` redirects to `/` when no draft exists.
- [x] 7.2 Ensure `/checkout/details` redirects to `/checkout/plan` when draft lacks `providerId` or `planId`.
- [x] 7.3 Ensure `/checkout/schedule` redirects to `/checkout/details` when draft lacks `customerId`.
- [x] 7.4 Audit all `redirect()` calls removed from legacy pages and confirm the new guards collectively cover the same invariants.

## 8. Totals helper hardening

- [x] 8.1 Audit `lib/orders/totals.ts` `calculateTotal()` for safety with partial drafts (no plan, no add-ons); ensure it returns `null` instead of throwing.
- [x] 8.2 If gaps are found, add early returns and type narrowing so the persistent panel can call it without try/catch.

## 9. Cleanup

- [x] 9.1 Delete obsolete imports and unused code paths in `components/checkout/` that are no longer composed by any page after consolidation.
- [x] 9.2 Remove any orphaned route segments left over from the old structure.
- [x] 9.3 Verify `pnpm typecheck` (or project equivalent) and `pnpm lint` pass clean.

## 10. Manual QA

- [x] 10.1 Walk through the full flow on desktop with a provider that has add-ons; confirm 3 phases, total panel updates live, submission completes, confirmation page renders.
- [x] 10.2 Walk through the full flow on mobile with a provider that has zero add-ons; confirm add-ons section is hidden, sticky bottom total bar works, validation scroll behavior is correct in Phase 2.
- [x] 10.3 Verify legacy URLs (`/checkout/add-ons`, `/checkout/summary`, `/checkout/customer`, `/checkout/payment`) all redirect correctly with and without an active draft.
- [x] 10.4 Verify Spanish copy across all phases uses "tú" form and contains no voseo.
