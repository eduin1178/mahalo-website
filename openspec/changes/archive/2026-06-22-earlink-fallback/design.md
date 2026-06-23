## Context

`getAvailableProviders(zip)` in `lib/coverage/availability.ts` is the single source of truth for which carriers a customer sees. It calls `findProvidersByZip(zip)` (`lib/coverage/queries.ts`), which inner-joins `provider_coverage` to `providers` filtered by `is_active`, then loads active plans and drops providers with zero plans. Every consumer — the `/checkout/provider` and `/checkout/plan` pages, and indirectly the routing rules (`length === 0` → empty state, `=== 1` → straight to plans, `>= 2` → provider screen) — depends on the shape it returns (`AvailableProvider[]`).

Today all providers are equal: presence of a `provider_coverage` row is the only gate. There is no notion of a last-resort carrier. Earlink must appear only when a ZIP has no other coverage, and must appear even where it has no coverage row at all.

## Goals / Non-Goals

**Goals:**
- Model "fallback / last-resort" as an admin-managed boolean on `providers`, not a hard-coded name.
- Suppress fallback providers whenever any ordinary provider with active plans covers the ZIP.
- Surface fallback providers universally (independent of `provider_coverage`) when no ordinary provider qualifies.
- Keep the change localized to the coverage layer + the provider admin; leave wizard routing and pages untouched.

**Non-Goals:**
- No change to wizard routing, stepper, or the `/checkout/*` pages.
- No change to landing marketing (hero logo strip, providers carousel) — fallback providers keep appearing there.
- No "single designated fallback" constraint at the data layer; multiple `is_fallback` providers are allowed.
- No per-ZIP fallback selection or priority ordering among fallbacks (all qualifying fallbacks are returned, ordered by name like ordinary providers).

## Decisions

### D1 — `is_fallback boolean NOT NULL DEFAULT false` on `providers`
Mirrors the existing `is_active` column exactly (type, nullability, default, admin handling). A boolean keeps administration trivial and consistent with the current form patterns. Multiple providers may be flagged; the resolution logic handles a set, not a singleton.

*Alternative considered — a `settings.fallbackProviderId` singleton:* guarantees exactly one fallback but introduces a settings concept/table the project does not have, and adds plumbing for a constraint the product does not actually require. Rejected in favor of the boolean (decision confirmed during exploration).

### D2 — Resolution branches on ordinary coverage, computed in `getAvailableProviders`
The fallback rule is a selection concern, so it lives in the availability layer, keeping the query helpers pure. Proposed shape:

```
1. ordinary = findProvidersByZip(zip) filtered to is_fallback = false
2. attach active plans; drop providers with 0 plans   → ordinaryWithPlans
3. if ordinaryWithPlans.length > 0:
        result = ordinaryWithPlans              (fallbacks excluded entirely)
   else:
        fallbacks = active providers where is_fallback = true   (IGNORE provider_coverage)
        attach active plans; drop providers with 0 plans
        result = those fallbacks
4. return { ok, zip, providers: result }
```

Two narrow query helpers (or one helper + a flag) feed this:
- `findProvidersByZip(zip)` gains an `is_fallback = false` predicate (ordinary-only), OR returns the flag so the caller can partition. Returning ordinary-only keeps the fallback path from ever depending on coverage rows.
- A new `listFallbackProviders()` in `lib/coverage/queries.ts` (or `lib/providers/queries.ts`) selecting active providers with `is_fallback = true`, **no** coverage join — this is what makes fallbacks universal.

*Alternative considered — gate inside `findProvidersByZip` with a UNION:* harder to express the "ignore coverage for fallbacks only when ordinary is empty" rule in one query, and couples two distinct concerns. Two reads (ordinary, then fallback only when needed) is clearer and the fallback read is skipped on the common path.

### D3 — Plan-loading stays shared
The active-plan load + "drop providers with no plans" step is identical for both branches. Keep it as one helper applied to whichever provider list won, so the existing `plansByProvider` logic is reused verbatim and fallback providers obey the same "must have active plans" rule (spec scenario).

### D4 — Admin surface mirrors `isActive`
- `providerCreateSchema` / `providerUpdateSchema` (`lib/providers/actions.ts`) gain `isFallback: z.boolean().default(false)`, parsed via the existing `parseBoolean` helper from the form's checkbox.
- `provider-edit-form.tsx` and `new-provider-dialog.tsx` get a checkbox/switch identical to the active toggle, with English label/copy (US market). A short helper text SHALL clarify it means "shown only when no other provider covers the ZIP".

### D5 — Seed marks Earlink
`lib/db/seed.ts` sets `isFallback: true` on the Earlink provider record so the behavior is live in seeded environments without manual admin steps. Existing rows default to `false` via the column default + migration.

## Risks / Trade-offs

- **A flagged fallback with no active plans silently disappears** → spec'd as the empty state; the admin helper text and the "must have active plans" rule make this explicit, but it is the admin's responsibility to load plans for the fallback. Mitigation: documented in admin copy.
- **Two DB reads on no-coverage ZIPs** → the fallback query runs only when ordinary coverage is empty (the rarer path), so the common path keeps a single read. Acceptable.
- **Marketing shows Earlink as a headline partner** → intentional per product decision (D2 non-goal); no mitigation needed, but called out so it is not mistaken for a leak of the flag.
- **A provider flagged both ordinary-covering and fallback** → the flag wins: `is_fallback = true` providers are never returned via the ordinary path (D2 step 1 filters them out), so they only ever appear in the fallback branch. This makes the flag unambiguous.

## Migration Plan

1. Add the column via Drizzle migration (`is_fallback boolean NOT NULL DEFAULT false`) — backfills all existing rows to `false`, so behavior is unchanged until a provider is flagged.
2. Deploy schema + logic together (the logic reads the new column).
3. Flag Earlink (seed for seeded envs; admin toggle in production).
4. Rollback: unflagging all providers restores today's behavior exactly; the column can remain (inert) or be dropped in a follow-up migration.
