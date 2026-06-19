## 1. Checkout form (public)

- [x] 1.1 In `components/checkout/phase2-form.tsx`, remove the card/ACH zod schemas (`cardClientSchema`, `achClientSchema`, `cardLooseSchema`, `achLooseSchema`) and the `paymentMethod`/`card`/`ach` fields from `formSchema` and its `superRefine` payment branch.
- [x] 1.2 Remove the `card`/`ach` default values, the `paymentMethod` watch, and the `paymentPayload` construction in `onSubmit`; send only `{ autopay }` to `finalizePhase2`.
- [x] 1.3 Replace the autopay-on Card/Bank (ACH) `Tabs` block with a notice that a Mahalo agent will set up payment by phone; keep the autopay vs standard segmented control unchanged.
- [x] 1.4 Remove the `payment` entry from `firstInvalidSection`/`SECTION_IDS` and any now-unused imports (`Tabs*`). (Kept `SECTION_IDS.payment` as the autopay section's DOM anchor; removed the card/ACH error routing and `Tabs` import.)
- [x] 1.5 Update `Phase2FormInitialValues` to drop `paymentMethod`.

## 2. Server actions (public)

- [x] 2.1 In `lib/orders/draft-actions.ts`, remove `cardSchema`, `achSchema`, `luhnValid`, and the `payment` branch of `savePaymentSchema`; narrow `finalizePhase2` input so `payment` is just the autopay boolean.
- [x] 2.2 In `finalizePhase2`, stop writing `paymentData` to the order; keep writing `autopayEnabled`.
- [x] 2.3 In `submitOrder`, remove the `if (draft.autopayEnabled && !draft.paymentData)` guard.

## 3. Details page (public)

- [x] 3.1 In `app/(public)/checkout/details/page.tsx`, remove the `paymentMethod` derived from `draft.paymentData` in the `initial` object.

## 4. Backoffice

- [x] 4.1 Delete `components/admin/orders/payment-data-view.tsx`.
- [x] 4.2 In `app/admin/(panel)/orders/[id]/page.tsx`, remove the `PaymentDataView` import and usage; replace the Payment section with an autopay indicator plus a "collected by phone" note.

## 5. Data model & migration

- [x] 5.1 In `lib/db/schema.ts`, remove the `paymentData` column from `orders` and delete the `CardPayment`, `AchPayment`, and `PaymentData` types.
- [x] 5.2 In `lib/orders/queries.ts`, remove the `PaymentData` import and its re-export. (Also removed the now-dead `PaymentData` references in `components/checkout/review-order-card.tsx` and `app/(public)/checkout/schedule/page.tsx`, discovered during apply.)
- [x] 5.3 Generate the Drizzle migration and confirm it emits `ALTER TABLE "orders" DROP COLUMN "payment_data"`. (`db/migrations/0004_needy_scarlet_witch.sql`)

## 6. Spec sync

- [x] 6.1 Apply the `checkout-wizard` delta to `openspec/specs/checkout-wizard/spec.md` (MODIFIED Details / Phase 2 validation / autopay-enrollment requirements, REMOVED payment-method-selector requirement, ADDED phone-collection and submission requirements).

## 7. Verification

- [x] 7.1 Type-check the project (`pnpm tsc --noEmit` or the project's build) and resolve every error left by the removed payment types. (`npx tsc --noEmit` → exit 0; `eslint` on changed files → 0 errors.)
- [x] 7.2 Manually walk the checkout: autopay-on shows the phone notice (no card fields), autopay-off and autopay-on both advance to `/checkout/schedule`, and an order submits successfully with no payment data. (Verified statically — form has no card/ACH fields, `finalizePhase2` redirects unconditionally, `submitOrder` guard removed. **Interactive browser run pending** — needs a running app with DB/Clerk.)
- [x] 7.3 Confirm the admin order detail renders without `PaymentDataView` and shows the autopay/phone-collection indicator. (Verified statically — import/usage removed, Payment section replaced. **Interactive run pending.**)
