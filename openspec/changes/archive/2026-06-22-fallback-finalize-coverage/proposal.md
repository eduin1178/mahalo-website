## Why

When a customer enters a ZIP that is absent from the database, the wizard correctly surfaces fallback providers (`is_fallback`) and their plans. But choosing one of those plans fails with "This plan isn't available for your ZIP." Discovery and finalize validation use two different definitions of "covered": discovery uses `getAvailableProviders` (fallback-aware), while `finalizePlan`/`finalizeProvider` re-derive coverage with `findProvidersByZip`, which excludes fallback providers and requires a matching `provider_coverage` row. The `earlink-fallback` spec scoped itself to "the set of providers feeding the wizard" and assumed downstream routing "operates on the resolved set unchanged" — but the finalize server actions never operated on the resolved set; they recompute coverage with the stricter rule. This makes the fallback offering unselectable, blocking checkout for any uncovered ZIP.

## What Changes

- `finalizePlan` validates the chosen plan's provider against the SAME resolved availability set the wizard used to display it (`getAvailableProviders`) instead of the fallback-excluding `findProvidersByZip`.
- `finalizeProvider` applies the identical unification so multi-provider fallback ZIPs can confirm a provider.
- A single source of truth for "is this provider available for this ZIP?" governs both discovery and finalize validation, preserving the existing ordinary-takes-precedence rule (fallback only surfaces when no ordinary provider qualifies).
- No change to the fallback discovery logic, schema, migrations, admin UI, or the `is_fallback` attribute — those already work.

## Capabilities

### New Capabilities
<!-- None: this change fixes existing behavior, it does not introduce a new capability. -->

### Modified Capabilities
- `checkout-wizard`: The coverage-resolution requirement is extended so that finalize-time validation (selecting a provider/plan) uses the same resolved availability set as discovery, ensuring a displayed fallback offering remains selectable through checkout.

## Impact

- Code: `lib/orders/draft-actions.ts` (`finalizePlan` ~L163, `finalizeProvider` ~L111).
- Behavior: customers on uncovered ZIPs can complete checkout with a fallback provider/plan.
- No database, migration, API surface, or UI changes. No breaking changes.
