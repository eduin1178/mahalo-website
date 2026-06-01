## Context

The checkout wizard is a 3-phase flow (Plan → Details → Schedule) under a shared layout at `app/(public)/checkout/layout.tsx`. Navigation between phases happens through server actions in `lib/orders/draft-actions.ts` that mutate the draft order and call `redirect()`. The order total is shown by `OrderTotalPanel` (a server component) rendered once in that shared layout.

Three localized issues remain after the prior polish pass; each is addressed independently. The non-trivial one is the Summary panel, whose failure is architectural (App Router cache behavior), not cosmetic.

Verified against the installed framework version (Next.js 16.2.4): client navigations and `redirect()` reuse cached layout segments under the default freshness policy; a shared layout already rendered is not re-fetched unless its segment is marked stale. `revalidatePath(path, "layout")` marks that segment stale so the subsequent navigation re-fetches it.

## Goals / Non-Goals

**Goals:**
- Place the Phase 3 review summary between the time picker and the consent control, keeping the submit button last.
- Make the persistent Summary panel reflect the draft after each phase transition.
- Replace the autopay switch with two clickable option cards (segmented control), preserving React Hook Form sync and accessibility.

**Non-Goals:**
- No changes to pricing/totals logic (`lib/orders/totals.ts`), DB schema, or server-action validation contracts.
- No redesign of the panel's visual content or the Card/ACH method selector.
- No change to the Phase 1 add-on live-update behavior (already works within a phase).

## Decisions

### Decision 1 — Review summary as a server-rendered slot passed into the client form

The review block currently renders in `schedule/page.tsx` (server) **after** `<ScheduleForm>` (client). To place it between the time section and the consent control — both of which live inside the client form — the review must appear within the form's JSX at that position.

**Chosen:** Keep the review server-rendered (it reads `breakdown`, `provider`, `customer` from the DB) and pass it into `ScheduleForm` as a `reviewSlot: ReactNode` prop. `ScheduleForm` renders `{reviewSlot}` between the "Choose a time" `SectionCard` and the disclaimer `SectionCard`. Extract the current inline review JSX into a `ReviewOrderCard` server component for clarity.

**Why:** React Server Components can be passed as props/children into client components; the node is serialized server-side. This keeps DB access on the server, avoids prop-drilling the full breakdown/provider/customer payload into the client, and is the idiomatic App Router pattern.

**Alternatives considered:**
- *Move data fetching into the client form and rebuild the review there* — rejected: heavy prop-drilling, duplicates formatting logic, no reason to leave the server.
- *Split ScheduleForm so the review sits between two sub-forms* — rejected: the date/time/consent state and the single submit must stay in one form; splitting would require lifting state with no benefit.

### Decision 2 — Fix the Summary panel via `revalidatePath("/checkout", "layout")` before redirect

`OrderTotalPanel` lives in the shared checkout layout. On a server-action `redirect()` from one phase to the next, App Router reuses the already-rendered layout segment, so the panel keeps its first render (the "Choose a plan" placeholder from before any plan existed). No checkout action currently calls `revalidatePath`.

**Chosen:** In `finalizePhase1` and `finalizePhase2`, call `revalidatePath("/checkout", "layout")` immediately before `redirect(...)`. This marks the layout segment stale; the redirect navigation then re-fetches the layout, re-running `OrderTotalPanel` against the updated draft.

**Why:** Minimal and targeted (two lines), keeps the panel as a server component, no restructuring of the layout grid. Matches the verified Next.js 16.2.4 behavior (stale segments are re-fetched on navigation).

**Alternatives considered:**
- *Move `OrderTotalPanel` out of the layout into each page* — rejected: the 2-column grid lives in the layout; moving the panel means relocating/duplicating that structure across three pages. More invasive for no added value.
- *Convert the panel to a client component that re-fetches via an action/endpoint* — rejected: over-engineered for a flow that already navigates with server redirects.

`scheduleInstallation` redirects to `/checkout/confirmation`, which is outside the panel's display paths, so it does not need revalidation. Phase 3 already renders fresh because the schedule page is `force-dynamic`; the gap is purely the layout-hosted panel after Phase 1 and Phase 2.

### Decision 3 — Autopay selector as a radiogroup of two cards

Today the two STANDARD / WITH AUTOPAY price cards in `phase2-form.tsx` are display-only and the choice is made via a header `<input type="checkbox" {...register("autopay")}>` switch.

**Chosen:** Remove the switch. Make the two cards a single-select segmented control: container `role="radiogroup"`, each card `role="radio"` with `aria-checked`, click and keyboard handlers calling `form.setValue("autopay", value, { shouldDirty: true, shouldValidate: true })`. Keep `const autopay = form.watch("autopay")` driving the emphasized styling and the conditional payment-method form (already wired). Register the `autopay` field so RHF still owns it (a visually-hidden registered input or a `Controller`), keeping the submission contract identical.

**Why:** Preserves the existing `savePaymentSchema` discriminated union on `autopay` and the conditional Card/ACH form with no contract change; only the input mechanism changes. Reconstructing native radio semantics keeps the accessibility the checkbox provided for free.

**Alternatives considered:**
- *Keep an invisible checkbox and style cards as labels for it* — viable but a two-state checkbox maps awkwardly to a two-card single-select; an explicit radiogroup is clearer for screen readers.

## Risks / Trade-offs

- **[`revalidatePath` doesn't refresh the panel as expected]** → Confirm in dev before merge with the documented hard-refresh test (load `/checkout/details` with a plan chosen; if F5 populates the panel but the normal flow doesn't, the layout-cache diagnosis holds and the fix targets it). If revalidation proves insufficient, fall back to Decision 2's first alternative (panel per page).
- **[Autopay a11y regression]** → Rebuilding radio semantics by hand can drop keyboard support or `aria-checked`. Mitigate by implementing the full radiogroup contract and verifying keyboard selection.
- **[RHF desync after removing the native input]** → If `autopay` is no longer registered, the discriminated-union schema could receive `undefined`. Mitigate by keeping the field registered (hidden input or `Controller`) and defaulting to `false`.
- **[Over-revalidation]** → `revalidatePath("/checkout", "layout")` re-renders the layout subtree on advance. The pages are already `force-dynamic`, so the cost is negligible and scoped to the checkout layout only.

## Migration Plan

No data migration. Pure UI + server-action changes. Rollback is a straight revert of the touched files; no persisted state depends on these changes.

## Open Questions

- None blocking. The panel-refresh behavior is verified against Next.js 16.2.4; the hard-refresh test in dev is a confirmation step, not a gate on the approach.
