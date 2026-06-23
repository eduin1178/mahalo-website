## Why

The ZIP search path calls the USPS API (`addresses/v3/city-state`) on every lookup, but the search is ZIP-only by design (no street address is collected, to avoid the FCC Broadband-label obligation). The USPS response (city/state) is therefore **discarded** — `installationAddress` is always null at search time — so the call adds latency, an external credential dependency, and failure modes (`upstream`, `rate_limited`, `timeout`) while contributing nothing to the result. Worse, it acts as a **gate**: a well-formed but USPS-unknown ZIP returns `not_found` and blocks the user before fallback resolution ever runs, instead of surfacing the fallback provider's plans.

## What Changes

- ZIP availability SHALL be resolved **only from the database** (`provider_coverage` + `providers`), never from the USPS address service.
- `getAvailableProviders` SHALL stop calling `validateAddress` and resolve providers directly from the DB. A well-formed ZIP with no ordinary coverage SHALL surface the active fallback provider(s) — the existing last-resort behavior — instead of being blocked.
- `createDraftOrder` SHALL stop calling `validateAddress` for the ZIP search and build the draft from the already-format-validated ZIP. `installationAddress` SHALL be `null` at draft creation (unchanged in practice).
- Format validation (`/^\d{5}$/`) SHALL remain the only ZIP gate, enforced at the existing layers (client `hero-search`, `classify`, and the `createDraftOrder` Zod schema).
- The USPS client (`lib/usps/client.ts`, `classify.ts`) SHALL be **retained** for future address verification at the Details step; only the ZIP-search call sites SHALL stop invoking it. No dead code is removed by this change.

## Capabilities

### New Capabilities
<!-- None: no new capability is introduced; this tightens an existing one. -->

### Modified Capabilities
- `checkout-wizard`: Adds an explicit requirement that ZIP/provider availability is resolved from the database (not an external address service), and that a well-formed but uncovered/unknown ZIP resolves to the fallback provider set rather than an address-lookup error.

## Impact

- **Code**: `lib/coverage/availability.ts` (drop `validateAddress` call), `lib/orders/draft-actions.ts` (drop `validateAddress` call in `createDraftOrder`; build draft from validated ZIP).
- **Retained, untouched**: `lib/usps/client.ts`, `lib/usps/classify.ts` (kept for future Details-step address verification).
- **Behavioral delta** (narrow): (1) well-formed but USPS-unknown ZIPs now route to fallback plans instead of an error; (2) USPS outage/rate-limit no longer blocks the search happy path.
- **Spec**: `openspec/specs/checkout-wizard/spec.md` already describes coverage purely in DB terms; this change adds a requirement locking that in and brings the code into line with it.
- **No** schema/migration change, no env-var removal (USPS credentials remain valid config for the retained client).
