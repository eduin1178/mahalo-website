## 1. Schema & migration (preferredCallAt)

- [x] 1.1 Add nullable `preferredCallAt` (`preferred_call_at timestamptz`) to the `orders` table in `lib/db/schema.ts`, next to `scheduledAt`, with a comment noting the UTC hour encodes the window
- [x] 1.2 Generate the additive Drizzle migration (`npx drizzle-kit generate`) and verify the SQL is purely additive (ADD COLUMN, no drops)
- [x] 1.3 Apply the migration locally and confirm the column exists

## 2. Server action & submit guard

- [x] 2.1 In `lib/orders/draft-actions.ts`, change `scheduleInstallation` to persist the chosen window to `preferredCallAt` (not `scheduledAt`), keeping the existing window/date validation (hour ∈ {8,10,14}, future date, not Sunday) and the consent stamp (`termsAcceptedAt` + `CONSENT_VERSION`)
- [x] 2.2 Update `submitOrder`'s completeness guard to require `draft.preferredCallAt` instead of `draft.scheduledAt`
- [x] 2.3 Verify the redirect to `/checkout/confirmation` still works and `scheduledAt` is left null on new orders

## 3. Checkout final-step UI

- [x] 3.1 In `app/(public)/checkout/schedule/page.tsx`, derive the form's initial values from `draft.preferredCallAt` instead of `draft.scheduledAt`; update the header copy to describe choosing when the advisor should call (English, US market)
- [x] 3.2 In `components/checkout/schedule-form.tsx`, reuse the calendar + three-window selector and consent block; update section/label copy from installation wording to advisor-call wording; keep "Place order" submit, the Mon–Sat rule, and the consent gating
- [x] 3.3 Confirm the interval label ("8 – 10 AM") still renders only in the selector

## 4. Consent reword + version bump

- [x] 4.1 In `lib/legal/consent.ts`, reword `CONSENT_COPY.after` to clarify the customer authorizes being contacted by a confirmation call at the selected time to confirm, verify, and activate the order; keep the Terms/Privacy links
- [x] 4.2 Bump `CONSENT_VERSION` to the current date and confirm `CONSENT_TEXT` still derives correctly from the segments
- [x] 4.3 Update the doc comment in `consent.ts` if it no longer matches the new copy

## 5. Downstream consumers (email, queries, webhook, confirmation)

- [x] 5.1 In `lib/resend/templates/new-order.ts`, add a "Preferred call time" section (HTML + text) rendering `preferredCallAt` as the window start hour; keep the existing "Scheduled installation" line (will read "—" until an agent schedules)
- [x] 5.2 Expose `preferredCallAt` in `lib/orders/queries.ts` (order detail/list rows) and `lib/customers/queries.ts` where order rows are read
- [x] 5.3 Verify `lib/webhook/trigger.ts` payload: include `preferredCallAt` if it sends scheduling fields; confirm it tolerates a null `scheduledAt`
- [x] 5.4 Verify the confirmation page renders correctly with a null `scheduledAt` (and shows the call window if it previously showed installation)

## 6. Back office (admin order detail)

- [x] 6.1 In `app/admin/(panel)/orders/[id]/page.tsx`, add a read-only "Preferred call" field (start-hour rendering) in the Schedule section, above/alongside the installation schedule
- [x] 6.2 Confirm `RescheduleForm` still sets `scheduledAt` (installation) and is unaffected by the new field

## 7. Hero provider logos (independent slice)

- [x] 7.1 In `app/(public)/page.tsx`, fetch active providers via `listProviders()` using the same tolerant pattern as `ProvidersGrid` (`safeListProviders`) and pass them to `<Hero providers={...} />`
- [x] 7.2 In `components/landing/hero.tsx`, accept a `providers` prop; remove the hardcoded `PROVIDER_WORDMARKS` array; render each provider as `logoUrl ? <img> : <span>name</span>` with a single uniform text style (no per-provider italic/weight)
- [x] 7.3 Hide the provider strip when there are no active providers
- [x] 7.4 Verify the logo image element has appropriate `alt={provider.name}` and reasonable sizing on the dark strip

## 8. Verification

- [x] 8.1 Run `tsc`/lint and the build; fix type errors from the schema/query changes
- [x] 8.2 Manually walk the checkout flow: pick a call window, accept consent, place order; confirm `preferredCallAt` is stored and `scheduledAt` is null
- [x] 8.3 Confirm the order email and admin order detail show the preferred call window; an agent can still set installation in the back office
- [x] 8.4 Confirm the hero renders logos from the DB with the uniform name fallback
