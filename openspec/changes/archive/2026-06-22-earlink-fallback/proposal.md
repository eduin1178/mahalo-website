## Why

Earlink is a carrier with effectively universal reach. We only want to surface it to a customer when their ZIP has no other coverage — never as competition alongside real providers. The current coverage logic treats every provider equally (a provider appears if and only if it has a `provider_coverage` row for the ZIP), so there is no way to model a "last-resort" carrier. We need this decision to be data-driven and admin-managed, not hard-coded to a provider name.

## What Changes

- Add an admin-managed `is_fallback` boolean to the `providers` model (multiple providers may be flagged).
- Change the checkout coverage resolution so that fallback providers are **shown only when no non-fallback provider with active plans covers the ZIP**.
- Fallback providers are treated as **universal**: they are offered even when the customer's ZIP is absent from their `provider_coverage` rows.
- When at least one non-fallback provider covers the ZIP, fallback providers are **excluded entirely**, even if they happen to have a matching coverage row.
- Expose the `is_fallback` toggle in the provider admin (create and edit forms + validation schemas).
- Landing marketing surfaces (hero logo strip + providers carousel) are **unchanged**: fallback providers still appear there. The flag scopes only to checkout coverage resolution.
- No change to downstream wizard routing: when the fallback is the only result (`length === 1`), the flow still redirects straight to `/checkout/plan`.

## Capabilities

### New Capabilities
<!-- None — this extends the existing checkout coverage behavior. -->

### Modified Capabilities
- `checkout-wizard`: The provider availability/coverage resolution gains fallback semantics — fallback providers are suppressed when real coverage exists and surfaced (universally) when it does not.

## Impact

- **Data model**: `providers` table gains `is_fallback boolean NOT NULL DEFAULT false` (Drizzle schema + migration). Seed marks Earlink as fallback.
- **Core logic**: `lib/coverage/availability.ts` (`getAvailableProviders`) and `lib/coverage/queries.ts` (`findProvidersByZip` and/or a new fallback query).
- **Backoffice**: `lib/providers/actions.ts` (`providerCreateSchema` / `providerUpdateSchema`) and `components/admin/providers/provider-edit-form.tsx` + `new-provider-dialog.tsx`.
- **Unaffected**: checkout wizard routing/pages, landing hero/carousel, plans/add-ons logic.
