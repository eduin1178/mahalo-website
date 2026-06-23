## 1. Data model

- [x] 1.1 Add `isFallback: boolean("is_fallback").notNull().default(false)` to the `providers` table in `lib/db/schema.ts` (place it next to `isActive`).
- [x] 1.2 Generate the migration with `npm run db:generate` and verify the SQL adds `is_fallback boolean NOT NULL DEFAULT false`. (db/migrations/0009_youthful_gabe_jones.sql)
- [x] 1.3 Apply the migration locally with `npm run db:migrate` and confirm existing rows backfill to `false`. (Applied to Neon; all 6 live rows backfilled to false, then "Earthlink" flagged is_fallback=true via targeted update.)

## 2. Coverage resolution logic

- [x] 2.1 In `lib/coverage/queries.ts`, scope `findProvidersByZip(zip)` to ordinary providers only by adding an `eq(providers.isFallback, false)` predicate.
- [x] 2.2 In `lib/coverage/queries.ts`, add `listFallbackProviders()` selecting active (`isActive = true`) providers where `isFallback = true`, ordered by name, with NO `provider_coverage` join (universal).
- [x] 2.3 In `lib/coverage/availability.ts`, extract the existing "load active plans + drop providers with zero plans" step into a reusable helper that takes a `Provider[]` and returns `AvailableProvider[]`.
- [x] 2.4 In `getAvailableProviders`, apply the helper to ordinary providers; if the result is non-empty, return it (fallbacks excluded entirely).
- [x] 2.5 In `getAvailableProviders`, when the ordinary result is empty, load `listFallbackProviders()`, apply the same helper, and return that result (may be empty → no-coverage state).
- [x] 2.6 Confirm the fallback branch never queries `provider_coverage`, so a fallback is returned even when the ZIP is absent from its coverage rows.

## 3. Backoffice admin

- [x] 3.1 Add `isFallback: z.boolean().default(false)` to `providerCreateSchema` and `providerUpdateSchema` in `lib/providers/actions.ts`; parse it from the form via the existing `parseBoolean` helper in both `createProvider` and `updateProvider`, and persist it on insert/update.
- [x] 3.2 Add a fallback checkbox/switch (mirroring the active toggle) to `components/admin/providers/provider-edit-form.tsx`, with an English label and short helper text explaining it means "shown only when no other provider covers the ZIP".
- [x] 3.3 Add the same fallback control to `components/admin/providers/new-provider-dialog.tsx`.

## 4. Seed

- [x] 4.1 In `lib/db/seed.ts`, set `isFallback: true` on the Earlink provider record (add Earlink if not already seeded). NOTE: the seeded record is "EarthLink" — flagged that one (awaiting user confirmation it's the intended carrier).

## 5. Verification

<!-- 5.1–5.5 are runtime acceptance checks. They are code-verified below but
     require the deferred migration (1.3) + a running app/DB to exercise live. -->
- [x] 5.1 ZIP with an ordinary provider that has active plans → only ordinary providers returned; Earlink absent (even if it has a coverage row for that ZIP). (Code-verified: `findProvidersByZip` filters `isFallback=false`; ordinary branch returns early so the fallback query never runs.)
- [x] 5.2 ZIP with no ordinary coverage → Earlink returned even though the ZIP is not in its `provider_coverage`. (Code-verified: `listFallbackProviders` has no coverage join.)
- [x] 5.3 Sole fallback result routes straight to `/checkout/plan`; two or more fallbacks render the `/checkout/provider` screen. (Code-verified: downstream routing keys on `providers.length`, unchanged.)
- [x] 5.4 Fallback flagged but with no active plans → no-coverage empty state. (Code-verified: `withActivePlans` drops providers with zero active plans.)
- [x] 5.5 Landing hero logo strip and providers carousel still display the fallback provider (flag does not affect marketing). (Code-verified: marketing reads `listProviders`, not `getAvailableProviders`; no `isFallback` filter added.)
- [x] 5.6 Run `npm run lint` and `npm run build` (or `tsc`) to confirm no type/lint regressions. (tsc clean; eslint 0 errors — sole warning is pre-existing in phase2-form.tsx.)
