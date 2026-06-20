## Context

Three related changes land together because they share one user journey (search → results):

1. **Search compliance.** `hero-search.tsx`, `mobile-sticky-search.tsx`, and the Final CTA share one `classifyInput` routine that today accepts a 5-digit ZIP **or** a free-text address (≥4 chars). The `/checkout` entry (`app/(public)/checkout/page.tsx`) reads both `zip` and `address` params, and `createDraftOrder` (`lib/orders/draft-actions.ts`) accepts either, validates via USPS, and stores the resolved ZIP. The reviewer wants address entry removed from the search step to avoid the FCC Broadband Consumer Labels trigger that comes with returning an address-specific price.

2. **Results presentation.** `lib/coverage/availability.ts` (`getAvailableProviders`) already returns providers grouped with their plans (`AvailableProvider[]`). `components/checkout/phase1-form.tsx` renders every provider expanded with a full plan grid. The change is presentation-only on the client: collapse to provider cards with an accordion when there are 2+ providers; render plans directly when there is exactly 1.

3. **Speed data model.** `plans.speed` is `varchar(64)` free text (`lib/db/schema.ts`). The teaser needs a reliable "fastest plan", and the admin needs structured input. Current distinct values are clean and finite: `200/300/500 Mbps` and `1/2/5/7/8` written as `Gbps` or `Gig`. Six call sites read `plan.speed`; one admin path writes it.

Constraints: Next.js 16 App Router, Drizzle + Neon Postgres, Tailwind v4, shadcn/ui. Product copy is English (US market, per `AGENTS.md`). The user will back up the database before apply.

## Goals / Non-Goals

**Goals:**
- Restrict all three search entry points to 5-digit ZIP only, with consistent validation copy.
- Render Plan-step results as provider cards: direct plans for a single provider, an accordion for multiple.
- Show a per-provider teaser: `From $X/mo` (cheapest autopay) · `up to Y` (fastest plan's value+unit).
- Replace free-text `speed` with structured, comparable columns and migrate existing data deterministically.
- Keep one shared `formatSpeed(value, unit)` used by every read site.

**Non-Goals:**
- No change to the four-phase wizard, installation-address collection in Details, or autopay/payment-by-phone behavior.
- No change to the provider→plan grouping query or coverage lookup logic.
- No address autocomplete or address-specific pricing (explicitly out — that is the compliance trigger being avoided).
- No availability-percentage metric (not in the data model; not added here).

## Decisions

### D1 — Speed as three columns: `speedValue` + `speedUnit` + `speedMbps`

Replace `speed varchar(64)` with:
- `speedValue numeric` — the displayed number (kept numeric to tolerate a future `1.2 Gbps`; current data is integer).
- `speedUnit` — a Postgres enum `plan_speed_unit` with values `Mbps`, `Gbps`. `Gig` is **not** a value; it canonicalizes to `Gbps` during migration.
- `speedMbps integer` — normalized megabit-equivalent for comparison/sort (`Mbps → value`, `Gbps → value*1000`).

**Why a third derived column over normalizing in code (alternative):** computing the fastest plan with `speedMbps` is a trivial `MAX`/sort in SQL or JS and stays correct across units; deriving it on every read would re-implement unit math at each call site. The denormalization is safe because `speedMbps` is only ever written from `speedValue`/`speedUnit` (admin write path computes it; migration computes it).

**Why an enum over free text:** the free-text field is exactly what created the inconsistency (`Gbps` vs `Gig`). Constraining to two units at the type level prevents regressions and powers the admin `<select>`.

### D2 — Deterministic data migration, not an LLM/manual pass

A single migration script parses each existing `speed` with `^(\s*)(\d+)\s*(Mbps|Gbps|Gig)(\s*)$` (case-insensitive, trimmed):
- value = captured digits; unit = `Mbps` if `Mbps` else `Gbps` (covers `Gbps` and `Gig`).
- `speedMbps` = value (Mbps) or value×1000 (Gbps).
- Rows that do not match → `speedValue = NULL`, `speedUnit = NULL`, `speedMbps = NULL`, and the row id + raw value is logged to stdout for manual admin correction.

New columns are added **nullable** first so the backfill cannot fail the insert; the old `speed` column is dropped only after backfill. This ordering is the rollback boundary (see Migration Plan).

### D3 — Accordion lives entirely in `phase1-form.tsx` (client), data unchanged

`getAvailableProviders` already returns `AvailableProvider[]`. The client decides layout from `providers.length`:
- `=== 1` → render the existing plan grid directly (current behavior for that one provider).
- `>= 2` → render a list of collapsed provider cards; expanding one mounts/reveals its plan grid.

Teaser values are derived per provider on the client from the already-fetched plans:
- price = `min(plans, p => p.priceAutopay)`.
- fastest = `max(plans, p => p.speedMbps)`; display its `speedValue`+`speedUnit` via `formatSpeed`.

Use a shadcn/Radix Accordion (or an equivalent disclosure with `aria-expanded`) for keyboard/AT support required by the spec. Single-provider mode does not use the accordion at all.

**Alternative considered:** compute teaser aggregates server-side and extend `AvailableProvider`. Rejected for now — the plans are already on the client, the aggregation is trivial, and keeping the server contract unchanged minimizes blast radius. Can be revisited if the teaser needs data the client doesn't have.

### D4 — `formatSpeed(value, unit)` as the single render path

Add `formatSpeed(value: number | null, unit: 'Mbps' | 'Gbps' | null): string` (likely in `lib/plans/` or a shared util). Returns e.g. `"300 Mbps"`, `"2 Gbps"`, and a safe fallback (e.g. `"—"`) for null (an unparsed row). All six read sites call it; no call site formats speed inline. This keeps the display identical everywhere and centralizes the null handling.

### D5 — ZIP-only validation shared and consistent

Collapse `classifyInput` to ZIP-only: trim, require `/^\d{5}$/`, otherwise return an invalid result with the message "Enter a 5-digit ZIP code." Apply to hero, Final CTA, and mobile sticky (they already share the routine). Drop the `address` branch and the `address` URL param path in `app/(public)/checkout/page.tsx` and the `address` input of `createDraftOrder`. The Details step's installation-address collection is untouched.

## Risks / Trade-offs

- **[Unparseable speed rows after migration]** → New columns are nullable; `formatSpeed` renders a safe fallback; the migration logs offending ids. Admin corrects them via the updated plan form. With the known current dataset, zero rows fail — but the path is defended for future dirty data.
- **[Dropping `speed` is irreversible without backup]** → User backs up before apply; columns are added and backfilled before the drop, so a failed backfill aborts before any destructive step.
- **[Six read sites + admin write path must all switch in lockstep]** → A compile-time win: removing `speed` from the Drizzle schema makes every stale `plan.speed` read a TypeScript error, so the compiler enumerates the remaining work. `formatSpeed` is the single replacement.
- **[Removing address search may surprise users who typed an address]** → Validation message explicitly tells them to enter a 5-digit ZIP; this is the intended compliance-driven behavior, not a regression.
- **[`numeric` for `speedValue` returns a string in Drizzle]** → comparisons for "fastest" must use `speedMbps` (integer), not `speedValue`; `formatSpeed` only displays `speedValue`, so string-typing there is harmless.

## Migration Plan

1. Back up the `plans` table (user-owned step, done before apply).
2. Add enum `plan_speed_unit` and the three nullable columns (`speedValue`, `speedUnit`, `speedMbps`).
3. Run the deterministic backfill (D2); review the logged unparseable rows (expected: none for current data).
4. Switch the Drizzle schema, `formatSpeed`, all six read sites, and the admin write path (Zod + form) to the structured columns.
5. Drop the old `speed` column.
6. Ship the ZIP-only search and the accordion UI (independent of the schema work; can be sequenced as separate work units/commits).

**Rollback:** before step 5, restoring is non-destructive (old `speed` still present). After step 5, restore from the backup taken in step 1.

## Open Questions

- None blocking. Decisions A (derived `speedMbps`), B (unit enum with `Gig→Gbps`), and C (null + log for unparseable) were confirmed with the user against the actual current dataset.
