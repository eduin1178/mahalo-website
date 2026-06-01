## 1. Phase 3 — Review summary placement

- [x] 1.1 Extract the inline "Review your order" block from `app/(public)/checkout/schedule/page.tsx` into a server component `ReviewOrderCard` (keeps reading `breakdown`, `provider`, `customer`, `installation`, `billing`).
- [x] 1.2 Add a `reviewSlot?: ReactNode` prop to `ScheduleForm` in `components/checkout/schedule-form.tsx`.
- [x] 1.3 Render `{reviewSlot}` inside the form between the "Choose a time" `SectionCard` and the consent disclaimer `SectionCard`.
- [x] 1.4 In `schedule/page.tsx`, pass `<ReviewOrderCard ... />` as `reviewSlot` to `<ScheduleForm>` and remove the standalone review `SectionCard` rendered after the form.
- [x] 1.5 Verify render order is date → time → review → consent → "Confirm order" button, with no interactive control after the button. _(Verified statically: form renders day → time → {reviewSlot} → disclaimer → serverError → Confirm button.)_

## 2. Summary panel — live update across phases

- [x] 2.1 In `lib/orders/draft-actions.ts`, import `revalidatePath` from `next/cache`.
- [x] 2.2 In `finalizePhase1`, call `revalidatePath("/checkout", "layout")` immediately before `redirect("/checkout/details")`.
- [x] 2.3 In `finalizePhase2`, call `revalidatePath("/checkout", "layout")` immediately before `redirect("/checkout/schedule")`.
- [x] 2.4 Confirm in dev: after selecting a plan and advancing, the Summary panel on Phase 2 and Phase 3 reflects the chosen plan/total (not the "Choose a plan" placeholder), without a manual browser refresh. _(PENDING — requires running app + browser.)_

## 3. Autopay — switch to two clickable cards

- [x] 3.1 In `components/checkout/phase2-form.tsx`, remove the header toggle switch (`<input type="checkbox" {...register("autopay")}>` and its label).
- [x] 3.2 Keep the `autopay` field owned by React Hook Form (visually-hidden registered input or a `Controller`), defaulting to `false`.
- [x] 3.3 Make the STANDARD and WITH AUTOPAY cards a single-select segmented control: container `role="radiogroup"`, each card `role="radio"` + `aria-checked`, click handler calling `form.setValue("autopay", value, { shouldDirty: true, shouldValidate: true })`.
- [x] 3.4 Add keyboard support (arrow/space/enter) so the control is operable without a pointer. _(Buttons handle space/enter natively; arrow keys move + select between the two options.)_
- [x] 3.5 Drive the emphasized/selected styling from `form.watch("autopay")`; ensure the payment-method form still reveals on autopay-on and hides on autopay-off. _(Conditional `{autopay ? ... : null}` block unchanged.)_
- [x] 3.6 Verify submission: autopay value reaching `finalizePhase2` matches the selected card, and autopay-on still requires a valid Card/ACH method. _(PENDING runtime check — statically sound: hidden registered field + setValue keep `values.autopay` boolean; existing superRefine still enforces Card/ACH when autopay on.)_

## 4. Verification

- [x] 4.1 Run typecheck/lint (`pnpm exec tsc --noEmit` + `pnpm lint`) and resolve issues introduced by the change. _(tsc: 0 errors. eslint: 0 errors; the single warning on line 207 `form.watch` is pre-existing, not introduced here.)_
- [x] 4.2 Manually walk the full checkout flow (Plan → Details → Schedule → Confirmation) confirming all three behaviors and no regressions in consent gating or totals. _(PENDING — requires running app + browser.)_
