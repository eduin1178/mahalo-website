## Why

PerfectVision's Marketing & Advertising Guidelines (Q2 2026) require that any lead form collecting customer information present a privacy policy, a disclaimer, and an explicit opt-in **positioned next to the form on the same page**, and that only such a submission "equates to customer consent for contact." Non-compliance carries fines of up to $500 per violation and possible termination. The checkout currently lets a customer submit an order (which triggers an agent calling them to verify identity before activation) with **no recorded consent and no terms/privacy acceptance gate**, so it fails both the dealer guidelines and the project's own requirement that customers accept the Terms of Service and Privacy Policy before purchase.

## What Changes

- Add a **required consent checkbox** to the final checkout step (`/checkout/schedule`, the `ScheduleForm`), positioned next to the "Confirm order" button on the same page.
- The checkbox is **not pre-checked**; "Confirm order" stays disabled until a slot is chosen **and** consent is given. Submitting without consent is rejected client-side and server-side.
- The disclaimer text combines, in a single statement: acceptance of the **Terms of Service** and **Privacy Policy** (both linked inline) and an **opt-in authorizing contact to process and activate the order** (transactional, automated-technology language). Contact here is required to fulfill the order, not marketing — so gating purchase on it is legitimate.
- **Persist proof of consent** on the order: capture `termsAcceptedAt` (timestamp) and `termsVersion` (the legal-copy version accepted) when the order is finalized, mirroring the existing `contact_messages.consent` precedent.
- `submitOrder` SHALL refuse to materialize an order whose consent was never recorded (defense in depth).
- All consent copy ships in **English** (US market, per `AGENTS.md`).

## Capabilities

### New Capabilities
<!-- None. This is a requirement change to the existing checkout flow. -->

### Modified Capabilities
- `checkout-wizard`: adds a requirement that the final phase capture and persist an explicit, non-pre-checked consent (Terms of Service + Privacy Policy acceptance and contact opt-in) before an order can be submitted, with the disclaimer and opt-in positioned next to the submit control on the same page.

## Impact

- **UI**: `components/checkout/schedule-form.tsx` — new consent checkbox, validation, disabled-state, inline links to `/legal/terms` and `/legal/privacy`.
- **Server actions**: `lib/orders/draft-actions.ts` — `scheduleInstallation` validates and persists consent (it runs with the user's checkbox value); `submitOrder` guards against finalizing an order with no recorded consent.
- **Schema / DB**: `lib/db/schema.ts` `orders` table — new `termsAcceptedAt` (timestamptz) and `termsVersion` (varchar) columns; one Drizzle migration.
- **Legal copy**: a single source-of-truth consent string + version constant (likely under `lib/legal/`).
- **Dependencies**: existing `/legal/terms` and `/legal/privacy` pages (already shipped) are linked, not modified.
- **No breaking changes** to public URLs or the three-phase stepper.
