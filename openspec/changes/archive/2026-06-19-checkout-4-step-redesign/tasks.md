## 1. Time-window helper (foundation)

- [x] 1.1 Add an `installation-window` helper module exposing the three windows (`{ startHour: 8 | 10 | 14 }`), an `intervalLabel(startHour)` formatter (e.g. `"8 – 10 AM"`), and a `startLabel(startHour)` formatter (e.g. `"8:00 AM"`).
- [x] 1.2 Add unit-level confidence: a pure function `windowFromHour`/`isValidWindowHour` rejecting any hour not in `{8, 10, 14}`.

## 2. Server actions (`lib/orders/draft-actions.ts`)

- [x] 2.1 Split `finalizePhase1` into `finalizePlan(planId)`: validate plan + coverage, persist `providerId`/`planId`, clear stale `addOnIds`.
- [x] 2.2 In `finalizePlan`, compute whether the provider has ≥1 active add-on and `redirect` to `/checkout/customize` (has add-ons) or `/checkout/details` (none); `revalidatePath('/checkout', 'layout')` before redirect.
- [x] 2.3 Add `finalizeAddOns(addOnIds)`: validate add-ons belong to the persisted plan's provider and are active, persist `addOnIds`, `revalidatePath` + `redirect('/checkout/details')`.
- [x] 2.4 Change `scheduleSchema.hour` from `min(8).max(17)` to an enum of `{8, 10, 14}`; keep the future-date/Sunday guards.
- [x] 2.5 Keep persisting `scheduledAt = Date.UTC(y, m, d, startHour)` (no schema change).

## 3. Stepper & routing

- [x] 3.1 Add a `Customize` entry to `PHASES` in `components/checkout/stepper.tsx` matching `/checkout/customize`; order: Plan, Customize, Details, Installation.
- [x] 3.2 Create `app/(public)/checkout/customize/page.tsx`: load add-ons for the draft's provider; defensive guard — if zero active add-ons, redirect to `/checkout/details`; guard missing plan → `/checkout/plan`.
- [x] 3.3 Update the legacy `/checkout/add-ons` redirect to target `/checkout/customize` (was `/checkout/plan`).
- [x] 3.4 Confirm draft-completeness guards: `/checkout/customize` and `/checkout/details` require `providerId`/`planId`; `/checkout/schedule` requires `customerId`.

## 4. Plan step (`components/checkout/phase1-form.tsx`, `app/(public)/checkout/plan`)

- [x] 4.1 Remove the inline add-ons section from `phase1-form.tsx`.
- [x] 4.2 Change the plan grid to three-per-row on large viewports (`sm:grid-cols-2 lg:grid-cols-3`), single column on mobile.
- [x] 4.3 Wire the primary action to `finalizePlan` and label it "Select plan".

## 5. Customize step UI

- [x] 5.1 Create a customize form component rendering the add-ons selector (reuse the markup removed from `phase1-form.tsx`), with a primary "Continue" action calling `finalizeAddOns`.
- [x] 5.2 Ensure the order-total panel is shown on `/checkout/customize` (no change needed beyond not hiding it).

## 6. Order-total panel visibility

- [x] 6.1 In `order-total-panel-client.tsx`, add `/checkout/plan` to the hide list (alongside `/checkout` and `/checkout/confirmation`).
- [x] 6.2 Verify the Plan page renders full-width when the panel is absent.

## 7. Details step (`components/checkout/phase2-form.tsx`)

- [x] 7.1 Set the form's initial `autopay` default to `true`.
- [x] 7.2 Swap the two payment-option cards' DOM order so "With autopay" is first (left) and "Standard" is second (right); keep refs/keyboard arrow logic consistent.
- [x] 7.3 Verify the payment-method form is revealed by default and that selecting "Standard" hides it.

## 8. Installation step (`components/checkout/schedule-form.tsx`, `review-order-card.tsx`)

- [x] 8.1 Replace the hourly 8–17 list with exactly three window options from the helper, rendered with `intervalLabel`.
- [x] 8.2 Lay out the date picker and the window selector side by side in one card (date left, windows right); collapse to stacked on mobile.
- [x] 8.3 Change the submit button label from "Confirm order" to "Place order"; keep it disabled until a window is chosen AND consent is checked.
- [x] 8.4 Render the chosen slot in the Review card (`review-order-card.tsx`) using `intervalLabel`.
- [x] 8.5 Submit the selected window's `startHour` to `scheduleInstallation`.

## 9. Downstream time rendering (start hour)

- [x] 9.1 Confirmation page: render the installation time via `startLabel` (start hour).
- [x] 9.2 Order email (`lib/resend/send`): render start hour.
- [x] 9.3 Webhook payload (`lib/webhook/trigger`): include start hour (unchanged `scheduledAt` is fine; verify formatting).
- [x] 9.4 Admin order views: render start hour.

## 10. Verification

- [x] 10.1 `pnpm exec tsc --noEmit` and `pnpm lint` pass.
- [x] 10.2 `pnpm build` (production) succeeds.
- [x] 10.3 Manual: provider WITH add-ons → Plan → Customize → Details → Installation → Place order → confirmation.
- [x] 10.4 Manual: provider WITHOUT add-ons → Plan advances straight to Details (Customize skipped); browser-Back from Details returns to Plan.
- [x] 10.5 Manual: panel hidden on Plan, visible on Customize/Details/Installation; autopay selected by default on Details; three windows render as intervals; confirmation/email show start hour.

## 11. Plan-step UX follow-ups

- [x] 11.1 Collapse the summary column on the Plan step so the plan grid spans full width (new `checkout-layout-grid.tsx` client wrapper; layout no longer reserves the 320px column on `/checkout/plan`).
- [x] 11.2 Make choosing a plan advance immediately: each plan card's "Choose plan" calls `finalizePlan` directly; removed the separate "Select plan" button.
- [x] 11.3 Make completed stepper steps clickable: each phase gains an `href`; "done" steps render as a `Link` to their route, current/future steps stay non-interactive.
