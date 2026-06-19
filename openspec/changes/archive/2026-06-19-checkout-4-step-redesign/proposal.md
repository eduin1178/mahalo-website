## Why

The checkout wizard currently crowds two unrelated jobs into Phase 1 (choosing a plan AND picking add-ons) and squeezes plan cards into a two-per-row grid alongside a summary panel, leaving each card cramped. Add-ons deserve their own focused step, the plan grid needs room to breathe (three across), and the scheduling step should offer simple, operations-friendly time windows instead of an hourly 8–17 list. This change restructures the flow into four clear steps and tightens the final-step UX so the wizard reads as a deliberate, premium funnel that also nudges customers toward autopay.

## What Changes

- **BREAKING** — The wizard goes from **three** steps to **four**: `Plan → Customize → Details → Installation`. The stepper, route set, and navigation guards all gain the new `Customize` step.
- **Plan (step 1)**: shows ONLY plan selection, laid out as **three cards per row** (was two). Add-ons are removed from this step. The persistent **order-total (Summary) panel is hidden on this step only** to give the three-column grid full width.
- **Customize (step 2, NEW)**: hosts the add-ons selector previously inline in Plan. When the selected plan's provider has **no active add-ons**, the step is **auto-skipped** server-side (the user never sees an empty page). The Summary panel is shown here.
- **Details (step 3, was step 2)**: unchanged in content, Summary panel still shown. The autopay/standard selector is **reordered and re-defaulted**: "With autopay" card on the **left and selected by default**, "Standard" on the right. Consequence (intended): the payment-method fields are revealed and required by default to promote autopay; the user must actively choose "Standard" to continue without payment data.
- **Installation (step 4, was step 3)**: Summary panel still shown. Eligible installation times are reduced to **three fixed windows** — `8–10 AM`, `10 AM–12 PM`, `2–4 PM` — replacing the hourly 8–17 list. Date picker and time windows sit **side by side in the same card** (date left, windows right). The Review summary stays. The submit button label changes from **"Confirm order"** to **"Place order"**.
- **Installation time data model**: the order stores only the **window start hour** (`8`, `10`, or `14`). The start hour is rendered everywhere the time appears (confirmation page, order email, n8n webhook payload, admin order views) EXCEPT inside the Installation step's slot picker and its Review card, which render the **interval** (`start`–`start+2h`, e.g. "8 – 10 AM").

## Capabilities

### New Capabilities
<!-- None. All behavior changes modify the existing checkout-wizard capability. -->

### Modified Capabilities
- `checkout-wizard`: phase count changes from three to four (adds `Customize`); Plan step drops add-ons, moves to a three-per-row grid, and hides the order-total panel; add-ons move to a new auto-skippable `Customize` step; order-total panel visibility changes from "all phases" to "all phases except Plan"; autopay selector is reordered with "With autopay" left and selected by default; installation scheduling is limited to three fixed time windows rendered as intervals while persisting only the start hour; final submit label becomes "Place order".

## Impact

- **Routing / navigation**: new `app/(public)/checkout/customize/` route; stepper `PHASES` (3→4); draft-completeness guards updated for the new ordering; legacy `/checkout/add-ons` redirect retargeted to `Customize`.
- **Server actions** (`lib/orders/draft-actions.ts`): `finalizePhase1` split so Plan persists the plan and redirects into `Customize` (which may auto-skip to `Details`); a new action persists add-ons from `Customize`; `scheduleSchema` restricted to start hours `{8, 10, 14}`.
- **Components**: `stepper.tsx`, `phase1-form.tsx` (3-col, remove add-ons), new customize form, `phase2-form.tsx` (reorder + autopay default), `schedule-form.tsx` (windows + layout + button), `review-order-card.tsx` (interval rendering), `order-total-panel(-client).tsx` (hide on Plan).
- **Downstream time rendering**: confirmation page, `lib/resend/send` order email, `lib/webhook/trigger` payload, and admin order views render the window start hour.
- **Spec**: existing `checkout-wizard` requirements for "exactly three phases", "Phase 1 combines plan + add-ons", "order total visible across all three phases", and "plan cards at most two per row" are superseded by this change.
