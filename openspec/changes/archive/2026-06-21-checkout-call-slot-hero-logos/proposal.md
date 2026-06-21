## Why

Two product corrections requested by the business:

1. The last checkout step currently asks the customer to schedule the *installation*. In reality, the customer should pick the **best time window to receive the advisor's confirmation call**; the installation date/time is set later by an agent in the back office, after that call. Forcing installation scheduling on the customer captures a commitment the business can't yet honor.
2. The hero's "Authorized Reseller" strip shows **hardcoded provider wordmarks** with mixed font styles (italic/non-italic). It should render each provider's **logo from the database**, with a single uniform text style as the no-logo fallback, so the strip stays in sync with the real provider catalog.

## What Changes

- **Checkout last step → preferred call window.** The final checkout step stops scheduling installation and instead lets the customer choose a preferred day + time window for the advisor's confirmation call. The selection UI mirrors today's scheduling form (calendar Mon–Sat + the three fixed windows).
- **New `preferredCallAt` field.** A new nullable `orders.preferred_call_at` timestamp stores the customer's chosen call window (the UTC hour encodes the window, symmetric with `scheduledAt`). Additive migration — non-destructive.
- **`scheduledAt` becomes admin-only.** The checkout no longer writes `scheduledAt`; it stays null on new orders and is set by an agent via the existing back-office `RescheduleForm`. The admin order view shows the customer's preferred call window (read-only) **alongside** the editable installation schedule.
- **`submitOrder` completeness guard** requires `preferredCallAt` instead of `scheduledAt`. **BREAKING** (internal): order submission no longer depends on an installation date.
- **Reinforced consent copy.** The transactional consent is reworded to clarify the customer will be contacted to **confirm** the order (the scheduled call), and `CONSENT_VERSION` is bumped so prior orders keep their accepted text in the audit trail.
- **Order email** gains a "Preferred call time" section; the installation line will read "—" until an agent schedules it.
- **Hero provider strip → DB logos.** The hero renders active providers from `listProviders()`: each provider shows its `logoUrl`, falling back to the provider name in a **single uniform style** (no per-provider italic/bold) when no logo exists. The hardcoded `PROVIDER_WORDMARKS` array is removed.

## Capabilities

### New Capabilities
<!-- None — both changes modify existing capabilities. -->

### Modified Capabilities
- `checkout-wizard`: the final step captures a preferred advisor-call window instead of an installation schedule; a new `preferredCallAt` field is persisted at checkout; `scheduledAt` (installation) becomes back-office-only; the consent requirement is reworded to cover the confirmation call.
- `public-landing`: the hero provider strip sources logos from the provider data source (`listProviders()`) with a uniform-style name fallback, replacing the hardcoded wordmark list.

## Impact

- **Schema / DB**: `lib/db/schema.ts` (+`preferredCallAt`); new additive Drizzle migration.
- **Server actions**: `lib/orders/draft-actions.ts` (`scheduleInstallation` writes `preferredCallAt`; `submitOrder` guard).
- **Checkout UI**: `app/(public)/checkout/schedule/page.tsx`, `components/checkout/schedule-form.tsx` (copy + target field).
- **Consent**: `lib/legal/consent.ts` (reworded copy + `CONSENT_VERSION` bump).
- **Back office**: `app/admin/(panel)/orders/[id]/page.tsx` (show `preferredCallAt` + keep installation editable).
- **Email**: `lib/resend/templates/new-order.ts` (preferred-call section).
- **Queries**: `lib/orders/queries.ts`, `lib/customers/queries.ts` (expose `preferredCallAt` where order rows are read).
- **Landing**: `components/landing/hero.tsx`, `app/(public)/page.tsx` (pass providers to the hero).
- **To verify during apply**: webhook payload (`lib/webhook/trigger.ts`) and the confirmation page for any `scheduledAt` rendering.
