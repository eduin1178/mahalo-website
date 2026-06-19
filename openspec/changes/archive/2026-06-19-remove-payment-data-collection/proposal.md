## Why

The checkout collects raw payment instruments — full card number, CVV, expiration, and ACH routing/account — and stores them in `orders.payment_data` as **plain-text JSON**. The admin order view even states it explicitly: *"Stored in plain text per requirement; PCI is the client's responsibility."* A site review flagged this: card data must not be captured or stored by the website. It is to be collected over the phone by an agent instead. Removing it takes the business out of PCI-DSS scope and eliminates a standing liability. There is no payment processor wired in today, so this data is never used to charge anyone — it is pure risk.

## What Changes

- **BREAKING**: Remove the card and ACH collection UI from the Details step (`/checkout/details`). The autopay segmented control stays, but selecting autopay no longer reveals payment fields.
- When autopay is selected, the form shows a notice that a Mahalo agent will set up the payment method by phone, instead of card/ACH inputs.
- **BREAKING**: `finalizePhase2` stops accepting and writing any payment instrument. Its input narrows to the autopay boolean only.
- Remove the `submitOrder` guard that required `payment_data` when autopay was enabled.
- Remove the admin `PaymentDataView` and its usage in the order detail page; the Payment section is replaced by an autopay/phone-collection indicator.
- **BREAKING**: Drop the `orders.payment_data` column via a destructive Drizzle migration, permanently deleting any stored card/ACH data. Remove the `CardPayment`, `AchPayment`, and `PaymentData` types from the schema.
- Autopay as a **price preference** is fully preserved: `orders.autopay_enabled`, the dual `priceStandard`/`priceAutopay` pricing, the plan-card emphasis, and the email/webhook `autopay` flag are unchanged. (The email and webhook never carried payment instruments, so they need no change.)

## Capabilities

### New Capabilities
<!-- None. This change removes behavior from an existing capability. -->

### Modified Capabilities
- `checkout-wizard`: The Details step no longer captures a payment method (card/ACH); autopay enrollment is decoupled from payment-instrument collection. The autopay-on path no longer requires or validates payment fields, and order submission no longer requires payment data.

## Impact

- **Checkout (public)**: `components/checkout/phase2-form.tsx`, `app/(public)/checkout/details/page.tsx`, `lib/orders/draft-actions.ts` (`finalizePhase2`, `submitOrder`, card/ACH zod schemas, `luhnValid`).
- **Backoffice**: `components/admin/orders/payment-data-view.tsx` (removed), `app/admin/(panel)/orders/[id]/page.tsx`.
- **Data model**: `lib/db/schema.ts` (drop `payment_data` column + payment types), `lib/orders/queries.ts` (`PaymentData` re-export), new destructive migration under `db/migrations/`.
- **Spec**: `openspec/specs/checkout-wizard/spec.md` requirements covering payment-method collection and autopay-on validation.
- **No change**: `lib/resend/templates/new-order.ts`, `lib/webhook/trigger.ts` (they only ever sent the autopay flag and prices).
- **Migration risk**: destructive and irreversible — any existing `payment_data` is lost by design. Acceptable: the data is plain-text PII with no downstream consumer.
