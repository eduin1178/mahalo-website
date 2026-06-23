## Context

The checkout wizard resolves provider availability through `getAvailableProviders(zip)` in `lib/coverage/availability.ts`. That function encodes the precedence rule: ordinary (non-fallback) providers covering the ZIP win; only when none qualify does it fall back to `listFallbackProviders()`, which returns active `is_fallback` providers regardless of any `provider_coverage` row.

The finalize server actions in `lib/orders/draft-actions.ts` re-derive coverage independently:

- `finalizeProvider` (~L111) calls `findProvidersByZip(draft.zipCode)`.
- `finalizePlan` (~L163) calls `findProvidersByZip(draft.zipCode)`.

`findProvidersByZip` (`lib/coverage/queries.ts`) filters `providers.isFallback = false` and inner-joins `provider_coverage` on the exact ZIP. By construction it can never return a fallback provider. So a fallback plan/provider that discovery legitimately surfaced for an uncovered ZIP is rejected at finalize time with "This … isn't available for your ZIP." The `earlink-fallback` spec scoped itself to discovery and assumed downstream routing operated on the resolved set — but these actions don't; they recompute with the stricter query.

## Goals / Non-Goals

**Goals:**
- Make finalize-time validation use the SAME resolved availability set as discovery, so any displayed offering stays selectable.
- Preserve the ordinary-takes-precedence rule (a fallback selection on a ZIP that has ordinary coverage is still rejected as stale).
- Keep the security property intact: a provider/plan NOT in the resolved set for the ZIP is still rejected.

**Non-Goals:**
- Changing fallback discovery, the `is_fallback` attribute, schema, migrations, or admin UI.
- Touching `submitOrder` final integrity checks (it validates draft completeness, not coverage; out of scope here).
- Refactoring `findProvidersByZip` itself — it remains correct for its discovery purpose.

## Decisions

### Decision: Validate against `getAvailableProviders`, not `findProvidersByZip`

In both `finalizePlan` and `finalizeProvider`, replace the `findProvidersByZip(draft.zipCode)` lookup with `getAvailableProviders(draft.zipCode)` and derive the covered provider id set from `result.providers.map((e) => e.provider)`.

```ts
// finalizePlan / finalizeProvider
const avail = await getAvailableProviders(draft.zipCode);
const covered = avail.ok ? avail.providers.map((e) => e.provider) : [];
if (!covered.some((p) => p.id === targetProviderId)) {
  return { ok: false, error: "This … isn't available for your ZIP." };
}
```

**Why:** `getAvailableProviders` is the single function that already encodes precedence + fallback. Reusing it guarantees discovery and validation agree by construction — the asymmetry cannot reappear because there is one definition of "covered."

**Alternatives considered:**
- *Extract `isProviderAvailableForZip(zip, providerId)` helper used by all three call sites.* Cleaner long-term, but `getAvailableProviders` already IS that single source; an extra helper adds a layer without removing the duplication risk. Rejected for this fix; can be a later refactor.
- *Add fallback providers to `findProvidersByZip`.* Wrong — that query is intentionally fallback-excluding for discovery precedence; changing it would break the "ordinary wins" rule. Rejected.

### Decision: Use the provider-level set, keep the existing plan existence/active check

`finalizePlan` already loads the plan and checks `isActive` (existing L154-L161). Keep that; only the coverage check changes. The plan's `providerId` is matched against the resolved covered set. `getAvailableProviders` also filters to active plans, so the resolved set is consistent with what was shown.

## Risks / Trade-offs

- [`getAvailableProviders` does slightly more work than `findProvidersByZip` — it also fetches active plans] → Negligible: one extra indexed query per finalize action, which happens once per step transition, not per render.
- [A fallback selection on a ZIP that gained ordinary coverage between display and finalize would now be rejected] → This is correct behavior (precedence wins); the user sees the not-available error and re-picks from the now-ordinary set. Acceptable and rare.
- [Both call sites must change together] → If only one is updated, multi-provider fallback ZIPs still break at `finalizeProvider`. Tasks enforce both.

## Migration Plan

Pure code change in one file. No data migration. Rollback = revert the two edited blocks. Deploy is a standard app deploy.
