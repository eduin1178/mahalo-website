## Context

The ZIP search is ZIP-only by design (no street address collected, to avoid the FCC Broadband-label obligation). Two call sites invoke the USPS client `validateAddress()`:

1. `createDraftOrder` (`lib/orders/draft-actions.ts`) — validates the ZIP, then builds `installationAddress` from `normalized.street`. Because ZIP-only search never yields a street, `installationAddress` is **always null**; the USPS city/state payload is discarded.
2. `getAvailableProviders` (`lib/coverage/availability.ts`) — validates the ZIP, then resolves providers from the DB via `findProvidersByZip` → `listFallbackProviders`. The fallback-on-empty behavior already exists here.

USPS therefore contributes only a **gate**: a well-formed but USPS-unknown ZIP returns `not_found`, short-circuiting before fallback resolution. The DB (`provider_coverage`) is already the source of truth for "do we serve this ZIP".

Constraints: format validation already lives in three layers independent of USPS (client `hero-search`, `lib/usps/classify`, and the Zod schema in `createDraftOrder`). The USPS client must be **retained** for a future Details-step address verification.

## Goals / Non-Goals

**Goals:**
- Resolve ZIP/provider availability purely from the database.
- Let every well-formed ZIP reach resolution; uncovered/unknown ZIPs surface fallback plans.
- Remove the external dependency (latency, credentials, `upstream`/`rate_limited`/`timeout`) from the ZIP-search happy path.

**Non-Goals:**
- Removing or refactoring the USPS client itself — it stays for future address verification.
- Changing the fallback resolution logic (already correct in `getAvailableProviders`).
- Any DB schema/migration change or env-var removal.
- Touching the Details-step address handling.

## Decisions

**Decision 1: Stop calling `validateAddress` at the two ZIP-search call sites; keep the client.**
Rationale: the call adds no value for ZIP-only search (payload discarded) and harms reliability. Keeping the client (option C, chosen by the product owner) preserves street-level verification for a future Details step without dead-code churn. Alternatives considered: (A) delete the client — rejected to preserve future address verification; (B) keep but bypass conditionally inside `validateAddress` — rejected as it leaks ZIP-search concerns into the client and keeps the dependency on the call graph.

**Decision 2: `getAvailableProviders` resolves directly from the DB and always returns `ok` for a format-valid ZIP.**
It keeps the `ordinary → fallback` resolution unchanged but drops the `validation.ok` early-return. For defense in depth it SHALL still guard ZIP format (`/^\d{5}$/`); a malformed ZIP yields an empty provider set (callers already render the empty state). The `AvailabilityError`/`ValidateAddressErrorCode` surface becomes effectively unreachable from these callers — we keep the result shape for now to minimize blast radius, and the `not_ok` branch in `provider/page.tsx` / `plan/page.tsx` remains as a harmless guard.

**Decision 3: `createDraftOrder` builds the draft from the Zod-validated ZIP, `installationAddress: null`.**
This is behavior-preserving (it was always null) and removes the only remaining `validateAddress` call in the search path.

## Risks / Trade-offs

- **Fake/typo ZIPs now reach fallback plans instead of erroring** → Acceptable and intended: the fallback provider is universal/last-resort, and the customer still confirms address later (Details) and by advisor call. Format check still blocks non-5-digit input.
- **Vestigial error types linger** (`AvailabilityError`, USPS `not_found` copy) → Low risk; left in place deliberately to keep the change small. A later cleanup can prune them once the Details-step verification design is settled.
- **`getAvailableProviders` no longer normalizes the ZIP via USPS** → Not a regression; the ZIP is already format-validated and `provider_coverage` is keyed on the raw 5-digit ZIP.

## Migration Plan

No data migration. Deploy is a pure code change; rollback is reverting the two call-site edits. USPS credentials remain valid configuration for the retained client.
