## Why

The client wants the checkout funnel to be leaner and to front-load the provider
decision, and to surface the consent disclaimer at the right moment instead of
burying it. The provider accordion mixes "which provider" with "which plan" in a
single step, the order-total panel and final review card add clutter the client
no longer wants, and billing-address capture is dead weight now that payment is
collected by phone. This also clears the ground for a future change that reframes
the funnel around scheduling a call instead of closing an order.

## What Changes

- Multi-provider ZIPs SHALL show a dedicated provider-selection screen **before**
  the Plan step. It is a pre-screen (not a numbered stepper phase) and only
  appears when more than one provider serves the ZIP. Single-provider ZIPs go
  straight to plans, unchanged.
- The plan accordion is replaced: once a provider is chosen, the Plan step shows
  only that provider's plans.
- A consent disclaimer SHALL be presented as a **mandatory modal** gated on the
  primary advance action. The modal's "Continue" button is the electronic
  signature (no checkbox). It appears on the Customize step's Continue button
  when the provider has add-ons, otherwise on the Plan step's "Choose plan"
  button. The trigger button shows a "Click for details" tooltip and the modal
  interpolates the provider name.
- Landing `PlanHighlights` cards SHALL prepend "Starting at" before the price.
- `ProvidersCarousel` SHALL render the provider `logoUrl` instead of
  `landingImageUrl`, with a redesigned card suited to logos.
- **BREAKING**: The order-total panel (`OrderTotalPanel`) SHALL be removed from
  every checkout step; the checkout layout collapses to a single column.
- **BREAKING**: Billing-address capture SHALL be removed from the checkout
  (the "Use a different billing address" card), and the `orders.billing_address`
  column SHALL be dropped via a destructive migration.
- **BREAKING**: The final step (Installation/Schedule) SHALL no longer render the
  `ReviewOrderCard`.

## Capabilities

### New Capabilities
<!-- No brand-new capability; all changes modify existing checkout/landing specs. -->

### Modified Capabilities
- `checkout-wizard`: provider selection becomes a pre-Plan screen for
  multi-provider ZIPs; the order-total panel requirement is removed; the consent
  disclaimer moves to a mandatory modal on the plan/customize advance action;
  billing-address capture is removed; the final step no longer shows the review
  card.
- `public-landing`: Plan Highlights cards prepend "Starting at"; the providers
  carousel renders provider logos instead of landing images.

## Impact

- **Routes**: new `app/(public)/checkout/provider/page.tsx`; changes to
  `plan`, `customize`, `details`, `schedule` pages and `checkout/layout.tsx`.
- **Components**: `phase1-form` (drop accordion), new provider-select + consent
  modal, `customize-form`, `phase2-form` (drop billing), `stepper` (unchanged
  numbering), `checkout-layout-grid` / `order-total-panel` (removed),
  `review-order-card` (removed from schedule), `plan-highlights`,
  `providers-carousel`.
- **Server actions**: new `finalizeProvider`; `finalizePhase2` drops billing
  fields and validation.
- **Database**: destructive migration dropping `orders.billing_address`
  (pre-production, no data to preserve).
- **Downstream**: admin order detail view and the Resend new-order email
  template lose their billing-address references.
- **Copy**: all new/changed strings in US English per project rule.
