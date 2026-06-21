## Context

The checkout wizard (`app/(public)/checkout/*`) is a four-phase funnel —
Plan, Customize, Details, Installation — sharing a layout that renders a stepper
and an `OrderTotalPanel` sidebar. Provider choice currently happens inside the
Plan step: a single provider shows plans directly, multiple providers render a
collapsed accordion (`Phase1Form`). The draft model (`orders` table) already
stores `providerId` and `planId` as independent nullable columns, plus
`billingAddress` (jsonb) and `autopayEnabled`. Payment is collected by phone, so
no payment instrument is captured on the site. The landing page renders static
`PlanHighlights` cards and a `ProvidersCarousel` fed from provider
`landingImageUrl`.

This change reshapes the funnel and trims it: a dedicated provider screen, a
consent modal at the plan/customize boundary, removal of the order-total panel,
the billing-address capture, and the final review card; plus two landing tweaks.
It deliberately stops short of the larger reframe (scheduling a call instead of
closing an order), which is a separate future change.

## Goals / Non-Goals

**Goals:**
- Promote provider selection to a pre-Plan screen for multi-provider ZIPs without
  adding a numbered stepper phase.
- Gate the plan/customize advance action behind a mandatory consent modal whose
  "Continue" button is the electronic signature.
- Remove the order-total panel, billing-address capture, and final review card,
  and collapse the checkout layout to a single column.
- Drop the now-unused `orders.billing_address` column (destructive, pre-prod).
- Land the two landing tweaks ("Starting at"; carousel logos).

**Non-Goals:**
- Reframing the funnel around scheduling a call (future change).
- Removing or consolidating the existing final-phase consent checkbox.
- Changing the autopay / pay-by-phone model.
- Any change to plan or add-on data models beyond billing removal.

## Decisions

### 1. Provider screen is a route, not a stepper phase
New route `app/(public)/checkout/provider/page.tsx` plus a `finalizeProvider`
server action that persists `providerId` (clearing `planId` and `addOnIds`) and
redirects to `/checkout/plan`. The stepper (`components/checkout/stepper.tsx`)
stays at four phases — the provider screen is a pre-step like the ZIP search,
so the client `usePathname` stepper needs no provider-count awareness.

- **Routing decision**: where does the funnel branch? The cleanest place is the
  existing entry bootstrap (`/checkout`) and the Plan-step guard. The Plan page
  already calls `getAvailableProviders(zip)`. We add: if `providers.length > 1`
  and the draft has no `providerId`, the Plan page redirects to
  `/checkout/provider`; the provider page renders the selection cards. When
  `providerId` is set, the Plan page queries only that provider's plans.
- **Alternative considered**: internal two-phase state inside `/checkout/plan`
  (no new route). Rejected — loses deep-linkability, breaks browser-Back
  semantics, and muddies the guard logic.
- `Phase1Form` loses its accordion branch; it always renders a single provider's
  `PlanGrid`. The provider-teaser code (price/speed) moves to the new provider
  card component.

### 2. Consent modal gated on the advance action; placement driven by add-ons
A reusable `ConsentDisclaimerModal` wraps the primary advance button. Clicking
the button opens the modal instead of advancing; the modal's "Continue" runs the
server action (`finalizePlan` or `finalizeAddOns`). Placement reuses the existing
`providerHasActiveAddOns` signal that already decides the Customize skip
(`lib/orders/draft-actions.ts:149`):
- has add-ons → modal on Customize "Continue".
- no add-ons → modal on Plan "Choose plan".

The trigger button carries a "Click for details" tooltip; the modal interpolates
the provider name into the `[Provider]` placeholder. Because the modal is a
mandatory gate (you cannot advance without it), the tooltip being absent on touch
devices is not a compliance gap — everyone sees the disclaimer on click.

- **Alternative considered**: a non-blocking "Click for details" link plus a
  checkbox. Rejected — the requirement text ("Clicking the button below
  constitutes your electronic signature") explicitly removes the checkbox.

### 3. Remove the order-total panel and single-column layout
Delete `OrderTotalPanel` from `checkout/layout.tsx`. `CheckoutLayoutGrid` loses
its two-column branch and becomes a simple max-width single column (or is removed
and the layout inlines the container). The `FULL_WIDTH_PATHS` special-case for
`/checkout/plan` disappears since every step is now full width.

### 4. Billing removal + destructive migration
Remove the "Use a different billing address" card and `useDifferentBilling` /
`billingAddress` from `phase2-form.tsx` (form schema, payload) and from
`finalizePhase2` (action schema, validation, persistence). Drop
`orders.billing_address` from `lib/db/schema.ts` and generate a Drizzle migration
(`drizzle-kit generate`) that issues `ALTER TABLE orders DROP COLUMN
billing_address`. Purge billing references from `review-order-card.tsx` (being
removed anyway), the admin order detail view, and the Resend new-order template.

- **Risk note**: destructive and irreversible, accepted because we are
  pre-production with no data to preserve.

### 5. Remove the final review card
Drop `ReviewOrderCard` from `schedule/page.tsx` and adjust `ScheduleForm` so the
`reviewSlot` is gone; the schedule card + consent + "Place order" remain. The
`review-order-card.tsx` component can be deleted once no longer referenced.

### 6. Landing tweaks
- `plan-highlights.tsx`: prepend "Starting at" before the static price.
- `providers-carousel.tsx`: switch the data field from `landingImageUrl` to
  `logoUrl` and redesign the card — light surface, `object-contain`, padding,
  name fallback on a brand-colored surface when no logo. Update the page that
  feeds the carousel (`app/(public)/page.tsx`) to pass `logoUrl`.

## Risks / Trade-offs

- **Two consent surfaces (modal + final checkbox)** → The new modal (early,
  electronic signature) and the existing final-phase consent checkbox (ToS +
  Privacy at order placement) now coexist. This is intentional and in-scope only
  to ADD the modal; consolidating them belongs to the future call-scheduling
  reframe. Documented here so it is a deliberate decision, not an oversight.
- **No order summary anywhere in checkout** after removing the panel and review
  card → Accepted by the client; the autopay segmented control on Details still
  shows monthly figures. Flagged because it removes the user's last full price
  read before "Place order".
- **Destructive migration** → irreversible drop of `orders.billing_address`.
  Mitigation: pre-production, explicitly authorized; run the migration in the same
  deploy as the code that stops writing the column.
- **Stale passing references to the order-total panel** in other spec
  requirements (e.g. plan-card layout copy) → harmless; those requirements still
  hold (the freed width is now permanent). No behavioral conflict.
- **Provider-screen guard regressions** → adding a branch to the Plan-step guard
  risks redirect loops. Mitigation: cover single-provider, multi-provider, and
  deep-link cases with the scenarios defined in the spec.

## Migration Plan

1. Schema: remove `billingAddress` from `orders` in `schema.ts`; run
   `drizzle-kit generate` to produce the DROP COLUMN migration.
2. Code: ship provider screen + `finalizeProvider`, consent modal, layout/panel
   removal, billing removal, review-card removal, landing tweaks together.
3. Deploy: apply the migration and the code in the same release so no code path
   reads or writes `billing_address` after the column is gone.
4. Rollback: revert the deploy; the dropped column cannot be restored, but since
   it is pre-production with no data, re-adding it via a forward migration (if
   ever needed) is sufficient.

## Open Questions

- None blocking. The two-consent-surfaces overlap (Decision 2 / Risks) is a known,
  accepted trade-off to be revisited in the future call-scheduling change.
