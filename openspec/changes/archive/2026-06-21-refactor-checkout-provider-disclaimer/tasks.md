## 1. Database: drop billing_address

- [x] 1.1 Remove `billingAddress` from the `orders` table in `lib/db/schema.ts` (and any exported `AddressJson` usage tied to billing on orders).
- [x] 1.2 Run `drizzle-kit generate` to produce the destructive migration (`ALTER TABLE orders DROP COLUMN billing_address`); verify the generated SQL.
- [x] 1.3 Apply the migration locally and confirm the column is gone and the app still boots.

## 2. Remove billing-address capture from checkout

- [x] 2.1 In `components/checkout/phase2-form.tsx`, remove the "Use a different billing address" `SectionCard`, the `useDifferentBilling`/`billingAddress` fields from the Zod schema, the `superRefine` billing branch, the `billingAddress` initial values, and the billing portion of the submit payload.
- [x] 2.2 In `lib/orders/draft-actions.ts` (`finalizePhase2`), remove `useDifferentBilling`/`billingAddress` from the action schema, validation, and persistence; stop writing `billingAddress` to the draft.
- [x] 2.3 In `app/(public)/checkout/details/page.tsx`, drop the billing initial-value wiring (`useDifferentBilling`, `billingAddress`).
- [x] 2.4 Purge billing references downstream: admin order detail view (`app/admin/(panel)/orders/[id]/page.tsx`) and the Resend new-order template (`lib/resend/templates/new-order.ts`).

## 3. Remove the order-total panel and collapse the layout

- [x] 3.1 In `app/(public)/checkout/layout.tsx`, remove `OrderTotalPanel` and render the children in a single-column container.
- [x] 3.2 Simplify or remove `components/checkout/checkout-layout-grid.tsx` (drop the two-column branch and the `FULL_WIDTH_PATHS` special case).
- [x] 3.3 Delete `order-total-panel.tsx` and `order-total-panel-client.tsx` once unreferenced; verify no remaining imports.
- [x] 3.4 Re-check spacing/width on Customize, Details, and Installation so the freed space reads as intentional, not an empty column.

## 4. Remove the final review card

- [x] 4.1 In `app/(public)/checkout/schedule/page.tsx`, remove `ReviewOrderCard` and the `reviewSlot` it fed into `ScheduleForm`.
- [x] 4.2 Update `components/checkout/schedule-form.tsx` so it no longer expects a `reviewSlot`; keep schedule + consent + "Place order" as the last elements.
- [x] 4.3 Delete `components/checkout/review-order-card.tsx` once unreferenced.

## 5. Provider selection pre-screen

- [x] 5.1 Add `finalizeProvider` to `lib/orders/draft-actions.ts`: validate the provider serves the ZIP, persist `providerId`, clear `planId` and `addOnIds`, then redirect to `/checkout/plan`.
- [x] 5.2 Create `app/(public)/checkout/provider/page.tsx`: for a multi-provider ZIP, render selectable provider cards with the price-and-speed teaser and identity (logo or colored-name fallback); single-provider ZIPs redirect to `/checkout/plan`.
- [x] 5.3 Extract the provider card (teaser + identity) into a component reused from the old accordion; ensure keyboard/screen-reader operability.
- [x] 5.4 Update `app/(public)/checkout/plan/page.tsx`: redirect to `/checkout/provider` when `>1` provider and no `providerId`; otherwise query and render only the chosen (or sole) provider's plans.
- [x] 5.5 Simplify `components/checkout/phase1-form.tsx`: remove the accordion branch; always render a single provider's `PlanGrid`.
- [x] 5.6 Verify the stepper still shows exactly four phases and that the provider screen is not numbered.

## 6. Consent disclaimer modal

- [x] 6.1 Build a reusable `ConsentDisclaimerModal` (shadcn `dialog`) with the disclaimer copy, `[Provider]` name interpolation, and a single "Continue" button that runs the gated action.
- [x] 6.2 Wire the modal to the Plan step's "Choose plan" button when the provider has no active add-ons; clicking opens the modal and "Continue" calls `finalizePlan`.
- [x] 6.3 Wire the modal to the Customize step's "Continue" button when the provider has active add-ons; "Continue" calls `finalizeAddOns`. Ensure the Plan step does NOT also show it for the same draft.
- [x] 6.4 Add the "Click for details" tooltip to the trigger button; confirm dismissing the modal does not advance.

## 7. Landing tweaks

- [x] 7.1 In `components/landing/plan-highlights.tsx`, prepend "Starting at" before the price in each `PlanCard`.
- [x] 7.2 In `components/landing/providers-carousel.tsx`, switch from `landingImageUrl` to `logoUrl` and redesign the card (light surface, `object-contain`, padding, name-on-brand-color fallback).
- [x] 7.3 Update `app/(public)/page.tsx` (and any provider query feeding the carousel) to pass `logoUrl` instead of `landingImageUrl`.

## 8. Verification

- [x] 8.1 Walk a single-provider ZIP end to end: plan → (customize if add-ons, with modal) → details (no billing) → schedule (no review) → confirmation.
- [x] 8.2 Walk a multi-provider ZIP: provider screen → plan (chosen provider only) → modal placement correct per add-ons → through confirmation.
- [x] 8.3 Confirm no order-total panel on any step and no billing field anywhere; confirm deep-link guards redirect correctly.
- [x] 8.4 Run typecheck/lint/build; confirm the destructive migration is the only schema change and the app builds clean.
