## 1. Speed schema and data migration

- [x] 1.1 Add a `plan_speed_unit` Postgres enum (`Mbps`, `Gbps`) and three nullable columns to the `plans` table in `lib/db/schema.ts`: `speedValue` (numeric), `speedUnit` (enum), `speedMbps` (integer). Keep the old `speed` column for now. Export the updated `Plan` type.
- [x] 1.2 Generate the Drizzle migration for the new enum + columns (`npx drizzle-kit generate` or project equivalent) and review the SQL. → `db/migrations/0005_short_firedrake.sql`
- [x] 1.3 Write a one-time backfill migration/script that parses each existing `plans.speed` with `^(\s*)(\d+)\s*(Mbps|Gbps|Gig)(\s*)$` (case-insensitive): set `speedValue` = digits, `speedUnit` = `Mbps` for `Mbps` else `Gbps` (canonicalizes `Gig → Gbps`), `speedMbps` = value or value×1000 for Gbps. → `scripts/backfill-speed.ts`
- [x] 1.4 In the backfill, set `speedValue/speedUnit/speedMbps` to NULL for any row that does not match and log each offending `{id, raw speed}` to stdout. Do not invent values.
- [x] 1.5 Ran the backfill against the (backed-up) database: 26/26 rows parsed cleanly, zero NULLs (200/300/500 Mbps; 1/2/5/7/8 Gbps, incl. "N Gig" → Gbps). One-shot script deleted after success (lives in git history + migrations 0005/0006).
- [x] 1.6 Generated and applied the drop migration (`db/migrations/0006_cynical_matthew_murdock.sql` → `DROP COLUMN "speed"`); removed `speed` from `lib/db/schema.ts`. `tsc --noEmit` clean.

## 2. Structured speed rendering

- [x] 2.1 Add a `formatSpeed(value, unit)` helper (e.g. in `lib/plans/`) returning "300 Mbps" / "2 Gbps" and a safe fallback (e.g. "—") for null; add a `fastestPlan(plans)` helper that picks the plan with the greatest `speedMbps`. → `lib/plans/speed.ts`
- [x] 2.2 Replace the `plan.speed` read in `components/checkout/phase1-form.tsx` with `formatSpeed`.
- [x] 2.3 Replace the `plan.speed` read in `components/checkout/review-order-card.tsx` with `formatSpeed`.
- [x] 2.4 Replace the `plan.speed` read in `components/checkout/order-total-panel.tsx` with `formatSpeed`.
- [x] 2.5 Replace the `plan.speed` reads in `lib/resend/templates/new-order.ts` (HTML and text parts) with `formatSpeed`.
- [x] 2.6 Replace the `plan.speed` read in `app/admin/(panel)/orders/[id]/page.tsx` with `formatSpeed`.
- [x] 2.7 Update the admin plans table read in `components/admin/plans/plans-section.tsx` to render `formatSpeed`, and change the create/edit form's single speed text input to a numeric value input + unit `<select>` (`Mbps`/`Gbps`).
- [x] 2.8 Update `lib/plans/actions.ts` (`planCreateSchema`/`planUpdateSchema` and the insert/update) to accept and validate `speedValue` + `speedUnit`, compute `speedMbps`, and stop reading/writing the free-text `speed`.
- [x] 2.9 Confirm the project type-checks with no remaining references to the removed `plan.speed` field. → `tsc --noEmit` + `eslint` clean

## 3. ZIP-only search

- [x] 3.1 Simplify `classifyInput` in `components/landing/hero-search.tsx` to ZIP-only: trim, require `/^\d{5}$/`, otherwise return an invalid result with copy "Enter a 5-digit ZIP code." Remove the `address` branch.
- [x] 3.2 Update the hero input placeholder, hint, and `aria-label` to reference a 5-digit ZIP code only (drop "or address"). (Final CTA shares the same `HeroSearch` component — covered.)
- [x] 3.3 Apply the same ZIP-only classification and copy to `components/landing/mobile-sticky-search.tsx` (and the Final CTA variant if it carries its own copy).
- [x] 3.4 Remove the `address` query-param handling from `app/(public)/checkout/page.tsx` so the entry consumes `zip` only. (Also updated `DraftBootstrap`.)
- [x] 3.5 Remove the `address` input from `createDraftOrder` in `lib/orders/draft-actions.ts` (accept `zip` only) and update its Zod input schema and any callers.
- [x] 3.6 ⏸ MANUAL Verify submitting a non-ZIP (including a full address) shows the ZIP validation message and does not navigate, on hero, Final CTA, and mobile sticky.

## 4. Provider-accordion results

- [x] 4.1 In `components/checkout/phase1-form.tsx`, branch on provider count: when exactly one provider, render its plans directly (current grid); when two or more, render one collapsed full-width card per provider.
- [x] 4.2 Build the collapsed provider card: provider identity (logo via `logoUrl`, else `name` in `primaryColor` fallback) plus the teaser `From $X/mo` (min `priceAutopay`) · `up to Y` (`formatSpeed` of `fastestPlan`). No plan name in the teaser.
- [x] 4.3 Implement the accordion expand/collapse (disclosure button with `aria-expanded`/`aria-controls`) that reveals the provider's plan grid in place; keyboard operable; pre-opens the provider of an already-chosen plan.
- [x] 4.4 Keep "Choose plan" behavior inside the expanded grid identical (immediate persist + advance); revealing plans does not add a wizard step; order-total panel stays hidden on the Plan step (unchanged).
- [x] 4.5 ⏸ MANUAL Verify both layouts: single provider shows plans directly with no card; multiple providers show collapsed cards whose grids appear only on expand.

## 5. Verification

- [x] 5.1 ⏸ MANUAL Walk a single-provider ZIP and a multi-provider ZIP through the Plan step; confirm teaser numbers match the cheapest-autopay and fastest-speed plans.
- [x] 5.2 ⏸ MANUAL Confirm speed renders identically (value + unit) across plan card, order review, order-total panel, order email, and admin order/plan views.
- [x] 5.3 ⏸ MANUAL Confirm ZIP-only validation and the unchanged Details-step installation-address collection still work end to end through order submission.
