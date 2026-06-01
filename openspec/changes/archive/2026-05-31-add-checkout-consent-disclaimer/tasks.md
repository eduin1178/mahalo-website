## 1. Consent copy source of truth

- [x] 1.1 Add a consent module under `lib/legal/` exporting the disclaimer text (English) and a `CONSENT_VERSION` identifier (date string, e.g. `2026-05-31`)
- [x] 1.2 Compose the disclaimer string to combine Terms of Service + Privacy Policy acceptance and transactional contact opt-in, with inline links to `/legal/terms` and `/legal/privacy`

## 2. Database schema and migration

- [x] 2.1 Add `termsAcceptedAt` (timestamptz, nullable) and `termsVersion` (varchar, nullable) columns to the `orders` table in `lib/db/schema.ts`
- [x] 2.2 Generate the Drizzle migration for the two additive columns
- [x] 2.3 Apply the migration to the database and verify the columns exist

## 3. Server action: capture and guard

- [x] 3.1 Extend the `scheduleInstallation` input schema in `lib/orders/draft-actions.ts` with `consent: z.literal(true)` and return a user-facing English error when consent is missing/false
- [x] 3.2 In `scheduleInstallation`, write `termsAcceptedAt = now()` and `termsVersion = CONSENT_VERSION` in the same `orders` update that sets `scheduledAt`
- [x] 3.3 In `submitOrder`, add an early-return guard that rejects finalization with a user-facing English error when `termsAcceptedAt` is null (order stays in `Draft`)

## 4. UI: consent control in ScheduleForm

- [x] 4.1 Add a non-pre-checked consent checkbox to `components/checkout/schedule-form.tsx`, positioned adjacent to the "Confirm order" button on the same page
- [x] 4.2 Render the disclaimer text with inline links to `/legal/terms` and `/legal/privacy` (open in new tab), sourced from the `lib/legal/` consent module
- [x] 4.3 Track consent in component state; disable "Confirm order" until a date, an hour, AND consent are all set
- [x] 4.4 Include `consent` in the `scheduleInstallation` payload and surface the server error inline if returned
- [x] 4.5 Show an inline English validation message when the user attempts to submit without consent

## 5. Verification

- [x] 5.1 Manually verify the checkbox renders unchecked, the submit stays disabled until slot + consent, and the legal links resolve to 200
- [x] 5.2 Verify a submitted order row has non-null `termsAcceptedAt` and `termsVersion`
- [x] 5.3 Verify `submitOrder` blocks finalization (with error) when `termsAcceptedAt` is null
- [x] 5.4 Confirm all consent-related copy is in English per `AGENTS.md`
