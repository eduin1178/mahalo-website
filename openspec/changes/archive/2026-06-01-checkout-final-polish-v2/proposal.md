# checkout-final-polish-v2

## Why

Three issues remain on the final steps of the checkout wizard after the previous polish pass:

1. On Phase 3, "Review your order" renders **after** the Confirm button, so the primary action is no longer the last thing on the page.
2. The persistent "Summary" panel does not reflect the user's selections as they advance between phases — it stays stuck on the "Choose a plan" placeholder. Root cause: the panel lives in the shared checkout layout, and App Router reuses already-rendered layout segments on the server-action `redirect()` navigations, which are never invalidated (no `revalidatePath` in the checkout actions).
3. Autopay enrollment is chosen via a small switch in the card header, which is easy to miss; the two price cards (STANDARD / WITH AUTOPAY) below it are display-only.

## What Changes

- **Phase 3 ordering**: Move the read-only "Review your order" summary to render **between** the "Choose a time" section and the legal consent disclaimer, so the order is: date → time → review → consent → Confirm button (button stays last). The review remains a server-rendered subtree and is passed into the client `ScheduleForm` as a slot prop.
- **Summary panel live update**: The persistent `OrderTotalPanel` SHALL reflect the current draft after each phase transition. Fix by calling `revalidatePath("/checkout", "layout")` before the `redirect()` in the checkout server actions that mutate the draft (`finalizePhase1`, `finalizePhase2`), so the stale layout segment is re-fetched on navigation.
- **Autopay selector**: Replace the header switch with the two STANDARD | WITH AUTOPAY cards acting as a clickable segmented control (radiogroup). Selecting "WITH AUTOPAY" enables autopay and reveals the payment-method form; selecting "STANDARD" disables it. The switch is removed. React Hook Form stays in sync and full keyboard/ARIA accessibility is preserved.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `checkout-wizard`: Three requirement-level behavior changes —
  - Phase 3 review summary placement (review before consent, submit last).
  - The persistent order-total panel must stay consistent with the draft across phase transitions (not only within a phase).
  - Autopay enrollment is selected via a two-option segmented control instead of a switch.

## Impact

- **UI / components**:
  - `components/checkout/schedule-form.tsx` (client) — accept and render a `reviewSlot` between time and disclaimer.
  - `app/(public)/checkout/schedule/page.tsx` (server) — extract the review block and pass it as the slot.
  - `components/checkout/phase2-form.tsx` (client) — replace the autopay switch with clickable radio cards; keep RHF + a11y.
- **Server actions**:
  - `lib/orders/draft-actions.ts` — add `revalidatePath("/checkout", "layout")` before `redirect()` in `finalizePhase1` and `finalizePhase2`.
- **No schema, DB, or API changes.** No new dependencies.
- **Framework note**: Behavior verified against Next.js 16.2.4 — `router.push`/`redirect` reuse cached layout segments unless marked stale, which `revalidatePath(..., "layout")` does.
