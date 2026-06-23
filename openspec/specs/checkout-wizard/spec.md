# Checkout Wizard Specification

## Purpose

Defines the public checkout wizard experience: a four-phase flow (Plan, Customize, Details, Installation), preceded by a dedicated provider-selection screen for multi-provider ZIPs, that lets a prospective customer choose a provider and plan, customize it with add-ons (auto-skipped when none exist), provide contact/address information and an autopay preference (payment instruments are collected by phone, never on the site), and schedule installation. A mandatory consent-disclaimer modal gates the plan/customize advance action, with guarded navigation, legacy URL redirects, and English (US market) copy.
## Requirements
### Requirement: Checkout wizard SHALL present exactly four user-visible phases

The public checkout flow SHALL display a stepper with exactly four phases, in this order: **Plan**, **Customize**, **Details**, **Installation**. Transient routes (bootstrap loader, terminal confirmation page) SHALL NOT appear as steps in the stepper.

#### Scenario: User lands in the wizard after ZIP lookup
- **WHEN** a user with a valid draft enters `/checkout/plan`
- **THEN** the stepper SHALL render four chips labeled `Plan`, `Customize`, `Details`, `Installation` and mark `Plan` as active.

#### Scenario: Stepper hides bootstrap and confirmation
- **WHEN** the user is on `/checkout` (bootstrap) or `/checkout/confirmation` (terminal)
- **THEN** the stepper SHALL either be hidden or render without numbering those screens as part of the four-phase progression.

### Requirement: Plan step SHALL present only plan selection

The Plan step (step 1, `/checkout/plan`) SHALL present plan selection ONLY. It SHALL NOT render the add-ons selector and SHALL NOT render the order-total panel; with the panel absent, the content SHALL span the full content width (the summary column SHALL NOT be reserved). The step SHALL render only the chosen provider's plans (the provider is chosen on the pre-Plan provider screen for multi-provider ZIPs, or is the single serving provider; see "Provider selection SHALL be a dedicated pre-Plan screen for multi-provider ZIPs"). Choosing a plan SHALL immediately persist it to the draft and advance to the next step — there SHALL be no separate confirm/continue button on this step.

#### Scenario: Plan step shows no add-ons and spans full width
- **WHEN** the Plan step renders
- **THEN** the page SHALL NOT render an add-ons selector
- **AND** the order-total panel SHALL NOT be rendered and SHALL NOT reserve a column, so the content uses the full content width.

#### Scenario: Choosing a plan advances immediately
- **WHEN** the user clicks a plan card's "Choose plan" action
- **THEN** the system SHALL persist that plan to the draft and navigate to the next step (Customize, or Details when the provider has no add-ons) without requiring any further confirmation action.

### Requirement: Customize step SHALL host add-ons and auto-skip when none exist

The Customize step (step 2, `/checkout/customize`) SHALL host the add-ons selector for the selected plan's provider. When the selected plan's provider has zero active add-ons, the step SHALL be skipped automatically via a server-side redirect to the Details step, so the user never sees an empty Customize page.

#### Scenario: Provider with active add-ons
- **WHEN** the user reaches `/checkout/customize` and the selected plan's provider has at least one active add-on
- **THEN** the add-ons selector SHALL render
- **AND** the primary action SHALL persist the selected add-ons to the draft and advance to the Details step.

#### Scenario: Provider without add-ons auto-skips
- **WHEN** the user reaches `/checkout/customize` and the selected plan's provider has zero active add-ons
- **THEN** the server SHALL redirect to `/checkout/details` without rendering an empty Customize page.

#### Scenario: Customize without a selected plan
- **WHEN** a session requests `/checkout/customize` and the draft is missing `providerId` or `planId`
- **THEN** the server SHALL redirect to `/checkout/plan`.

### Requirement: Details step SHALL combine customer information and payment preference in a single view

The Details step (step 3, `/checkout/details`) SHALL capture contact information, installation address, and autopay enrollment (a price preference only) in one page with sectioned layout. The step SHALL NOT capture a billing address and SHALL NOT capture a payment method (card or ACH). No order-total panel SHALL be rendered.

#### Scenario: Loading Details with no prior data
- **WHEN** the user enters the Details step for the first time
- **THEN** the page SHALL render the contact, installation address, and payment-preference sections, all editable
- **AND** no billing-address section and no order-total panel SHALL be present.

#### Scenario: Advancing from Details with valid data
- **WHEN** the user clicks the primary action and all required fields are valid
- **THEN** the system SHALL persist the data to the draft and navigate to the Installation step (`/checkout/schedule`).

#### Scenario: Advancing from Details with invalid data
- **WHEN** the user clicks the primary action and one or more sections have validation errors
- **THEN** the system SHALL prevent navigation, display inline error messages, and scroll to the first section with errors.

### Requirement: Legacy checkout URLs SHALL redirect to the consolidated routes

Old routes (`/checkout/add-ons`, `/checkout/summary`, `/checkout/customer`, `/checkout/payment`) SHALL respond with a 302 redirect to the route corresponding to the user's current draft state, preserving session cookies. `/checkout/add-ons` SHALL redirect to `/checkout/customize`.

#### Scenario: Legacy add-ons URL
- **WHEN** an authenticated session with an active draft that has a selected plan requests `/checkout/add-ons`
- **THEN** the server SHALL respond with a 302 redirect to `/checkout/customize` and the draft SHALL remain intact.

#### Scenario: Hitting a removed URL with an active draft
- **WHEN** an authenticated session with an active draft requests `/checkout/payment`
- **THEN** the server SHALL respond with a 302 redirect to `/checkout/details` and the draft SHALL remain intact.

#### Scenario: Hitting a removed URL without a draft
- **WHEN** a session without an active draft requests `/checkout/summary`
- **THEN** the server SHALL respond with a 302 redirect to `/` (home / ZIP lookup).

### Requirement: Navigation between phases SHALL be guarded by draft completeness

The system SHALL prevent direct navigation to a later phase if the draft does not contain the data required by all earlier phases.

#### Scenario: Direct access to Installation without Details data
- **WHEN** a session attempts to access `/checkout/schedule` and the draft is missing `customerId`
- **THEN** the server SHALL redirect to `/checkout/details`.

#### Scenario: Direct access to Details without a plan
- **WHEN** a session attempts to access `/checkout/details` and the draft is missing `providerId` or `planId`
- **THEN** the server SHALL redirect to `/checkout/plan`.

#### Scenario: Direct access to Customize without a plan
- **WHEN** a session attempts to access `/checkout/customize` and the draft is missing `providerId` or `planId`
- **THEN** the server SHALL redirect to `/checkout/plan`.

#### Scenario: Direct access to Plan without a draft
- **WHEN** a session attempts to access `/checkout/plan` and there is no active draft
- **THEN** the server SHALL redirect to `/`.

### Requirement: Completed steps SHALL be navigable from the stepper

The stepper SHALL let the user return to any already-completed step by clicking that step's indicator. A completed step (one before the current step) SHALL be an interactive control that navigates to that step's route. The current step and not-yet-reached steps SHALL NOT be interactive.

#### Scenario: Clicking a completed step navigates back
- **WHEN** the user is on a later step and clicks the indicator of an earlier, completed step
- **THEN** the system SHALL navigate to that earlier step's route (subject to the existing draft-completeness guards).

#### Scenario: Current and future steps are not interactive
- **WHEN** the stepper renders the current step and steps not yet reached
- **THEN** those indicators SHALL NOT be clickable navigation controls.

### Requirement: All user-facing copy in the wizard SHALL be in English (US market)

Every label, button, placeholder, validation message, error, empty state, success state, tooltip, and visible aria-label rendered to the end user across the live checkout flow (Plan, Details, Schedule, Confirmation) SHALL be in English. This includes Zod validation messages, phone-type labels, and the user-facing `error` strings returned by the checkout server actions (`createDraftOrder`, `finalizePhase1`, `finalizePhase2`, `scheduleInstallation`). This product serves a US market; a corresponding project-level override is documented in `AGENTS.md`.

#### Scenario: CTA labels
- **WHEN** the wizard renders a primary call-to-action to advance phases
- **THEN** the label SHALL be in English (e.g., "Continue", "Confirm order").

#### Scenario: Validation messages
- **WHEN** a form field fails validation
- **THEN** the message SHALL be in English (e.g., "Enter a valid ZIP", "Required").

#### Scenario: Server action errors
- **WHEN** a checkout server action returns a user-facing error
- **THEN** the message SHALL be in English (e.g., "Your session expired. Start over.", "Choose a plan first.").

#### Scenario: Phone-type labels
- **WHEN** the contact section renders the phone-type options
- **THEN** the labels SHALL read "Mobile", "Home", and "Work".

### Requirement: Phase 2 client validation SHALL NOT block advancing when autopay is disabled

The Phase 2 form SHALL allow the user to submit and advance regardless of the autopay selection, without requiring or validating any payment fields. The form SHALL NOT contain card or ACH fields, so neither the autopay-on nor the autopay-off path SHALL produce hidden validation errors that prevent submission.

#### Scenario: Advancing with autopay off
- **WHEN** the user fills contact and installation address with valid data, leaves autopay disabled, and clicks the advance CTA
- **THEN** the form SHALL pass client validation, invoke `finalizePhase2`, and navigate to Phase 3 (`/checkout/schedule`).

#### Scenario: Advancing with autopay on
- **WHEN** the user enables autopay and clicks the advance CTA with valid contact and address data
- **THEN** the form SHALL pass client validation and advance, with no payment field gating submission.

### Requirement: Plan cards SHALL emphasize the autopay price as the primary value

Each plan option in Phase 1 SHALL display the autopay price as the visually dominant value with a "with autopay" label, and the standard price SHALL be shown as a smaller, secondary value.

#### Scenario: Plan card pricing hierarchy
- **WHEN** a plan card renders its pricing
- **THEN** the autopay price SHALL be the largest pricing element with a "with autopay" label
- **AND** the standard price SHALL be rendered smaller and visually secondary.

### Requirement: Final phase SHALL capture explicit consent before an order can be submitted

The final checkout phase (`/checkout/schedule`) SHALL present a single consent control, positioned next to the order-submission control on the same page, that the user MUST affirmatively accept before the order can be submitted. The consent control SHALL combine acceptance of the Terms of Service and the Privacy Policy with an opt-in authorizing Mahalo and its authorized partners to contact the customer — including by a confirmation call at the time the customer selected — to confirm, verify, and activate the order. The consent text SHALL link to `/legal/terms` and `/legal/privacy`, SHALL be in English (US market), and the control SHALL NOT be pre-checked.

#### Scenario: Consent control is rendered next to the submit control
- **WHEN** the user enters the final phase with a complete draft
- **THEN** the page SHALL render an unchecked consent checkbox on the same page as, and adjacent to, the "Place order" control
- **AND** the consent text SHALL include inline links to the Terms of Service (`/legal/terms`) and the Privacy Policy (`/legal/privacy`)
- **AND** the consent text SHALL state that the customer authorizes being contacted to confirm the order.

#### Scenario: Consent is not pre-checked
- **WHEN** the final phase first renders
- **THEN** the consent checkbox SHALL be unchecked
- **AND** the "Place order" control SHALL be disabled until a valid call window is chosen AND the consent checkbox is checked.

#### Scenario: Attempting to submit without consent (client)
- **WHEN** the user has chosen a valid call window but the consent checkbox is unchecked and attempts to submit
- **THEN** the system SHALL prevent submission and display a validation message indicating consent is required.

#### Scenario: Attempting to submit without consent (server)
- **WHEN** a submission reaches the server action without recorded consent
- **THEN** the server action SHALL reject the submission with a user-facing error and SHALL NOT advance the order.

### Requirement: Accepted consent SHALL be persisted as proof on the order

When an order is submitted, the system SHALL persist proof of the accepted consent on the order record: the timestamp at which consent was given and the version identifier of the consent copy that was accepted. An order SHALL NOT be materialized (moved out of `Draft`) unless this proof is present.

#### Scenario: Consent proof recorded at submission

- **WHEN** the user submits the order with consent given
- **THEN** the order SHALL store the consent timestamp and the consent-copy version
- **AND** the order SHALL proceed to `/checkout/confirmation`.

#### Scenario: Finalization blocked without consent proof

- **WHEN** the order-finalization server action runs for an order that has no recorded consent timestamp
- **THEN** it SHALL return a user-facing error and SHALL leave the order in its pre-finalized state.

### Requirement: Plan cards SHALL display provider identity via a dedicated card logo with a colored-name fallback

Each plan option in Phase 1 SHALL present the provider's identity using a dedicated card logo image sourced from the provider's `logoUrl` field. This field is distinct from the landing carousel image (`landingImageUrl`) and is optional. When the card logo is present it is the sole identity element; when it is absent the provider name SHALL stand in as a prominent, brand-colored fallback so the carrier is always identifiable.

#### Scenario: Provider has a card logo

- **WHEN** a plan card renders for a provider whose `logoUrl` is set
- **THEN** the card SHALL render the logo image (contained, not cropped) as the provider identity element
- **AND** the card SHALL NOT render the provider name as fallback text in the identity slot.

#### Scenario: Provider has no card logo

- **WHEN** a plan card renders for a provider whose `logoUrl` is null or empty
- **THEN** the card SHALL render the provider `name` as text in the identity slot
- **AND** that text SHALL use the provider's `primaryColor` as its color and SHALL be rendered larger than ordinary card label text so it reads as the protagonist
- **AND** the fallback SHALL sit on a subtle `primaryColor`-tinted background to preserve legibility regardless of the brand color.

#### Scenario: Card logo is independent of the landing image

- **WHEN** a provider has a `landingImageUrl` but no `logoUrl`
- **THEN** the plan card SHALL use the colored-name fallback and SHALL NOT fall back to the landing image.

### Requirement: Plan cards SHALL lay out at most three per row

The Plan step grid SHALL render at most **three** plan cards per row on large viewports, using the full single-column content width. Narrower viewports MAY collapse to two columns or a single column.

#### Scenario: Large viewport

- **WHEN** the Plan step grid renders on a large (desktop) viewport
- **THEN** the grid SHALL show up to three plan cards per row.

#### Scenario: Small viewport

- **WHEN** the Plan step grid renders on a narrow (mobile) viewport
- **THEN** the grid SHALL collapse to a single column.

### Requirement: Plan cards SHALL signal interactivity with a hover elevation

Each plan card SHALL respond to pointer hover with an elevation effect (a subtle upward lift and an increased shadow) via a smooth transition, communicating that the card is selectable. The hover effect SHALL NOT override or conflict with the visual treatment of the currently selected card.

#### Scenario: Hovering an unselected card

- **WHEN** the user hovers the pointer over a plan card that is not selected
- **THEN** the card SHALL animate to a raised state (lift + stronger shadow) and SHALL return to rest when the pointer leaves.

#### Scenario: Selected card retains its treatment

- **WHEN** a card is in the selected state
- **THEN** its selected styling (border/ring) SHALL remain visually dominant and SHALL NOT be replaced by the hover elevation.

### Requirement: Checkout plan cards and form sections SHALL share a cohesive premium card surface

The Plan step plan cards, the Customize step add-ons selector, each Details step section (contact, installation address, billing, payment), and the Installation step sections (the combined date-and-time-window card, the consent control, and the order review summary) SHALL be presented on the same elevated "premium" card surface used by the landing plan highlights (rounded, soft-shadowed, with a light decorative accent), so the checkout reads as one cohesive, premium experience. Containers that are not themselves selectable (the add-ons selector and the Details/Installation form and review sections) SHALL NOT apply the hover-lift reserved for selectable plan cards. An address block embedded inside another section (billing inside the billing section) SHALL NOT be double-wrapped in its own card.

#### Scenario: Plan surfaces

- **WHEN** the Plan step renders
- **THEN** the plan cards SHALL use the premium card surface.

#### Scenario: Customize surfaces

- **WHEN** the Customize step renders
- **THEN** the add-ons selector SHALL use the premium card surface and SHALL NOT lift on hover.

#### Scenario: Details surfaces

- **WHEN** the Details step renders
- **THEN** the contact, installation address, billing, and payment sections SHALL each be a premium card, and the optional billing address embedded in the billing section SHALL NOT be wrapped in a second card.

#### Scenario: Installation surfaces

- **WHEN** the Installation step renders
- **THEN** the combined date-and-time-window card and the consent control SHALL each use the premium card surface and SHALL NOT lift on hover.

### Requirement: The primary advance action SHALL be a prominent button

The Customize and Details steps' primary advance action ("Continue") and the Installation step's ("Place order") SHALL be rendered as a large primary button (full-width on mobile) so it is clearly the main action of the step. The Plan step is exempt: it advances by choosing a plan card and SHALL NOT render a separate advance button.

#### Scenario: Advance button prominence

- **WHEN** the Customize or Details step renders its "Continue" action
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

#### Scenario: Place order button prominence

- **WHEN** the Installation step renders its "Place order" action
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

### Requirement: The confirmation screen SHALL present a celebratory success state

When an order is successfully submitted, the confirmation screen SHALL present a celebratory success state: a prominent success icon, a celebratory heading, the order reference shown as a prominent element, and a clear next-step, rendered on the checkout's premium card surface. On success the screen SHALL trigger a one-time confetti burst. The confetti SHALL fire at most once per visit and SHALL be suppressed entirely when the user's `prefers-reduced-motion` setting requests reduced motion. The confirmation error state (order could not be submitted) SHALL NOT show celebratory styling or confetti.

#### Scenario: Successful submission celebrates

- **WHEN** the confirmation screen renders for a successfully submitted order
- **THEN** it SHALL show the success icon, celebratory heading, prominent order reference, and next-step
- **AND** it SHALL trigger a single confetti burst.

#### Scenario: Reduced motion suppresses confetti

- **WHEN** the confirmation screen renders for a successful order AND the user requests reduced motion
- **THEN** no confetti SHALL be shown, while the rest of the success layout renders normally.

#### Scenario: Error state does not celebrate

- **WHEN** the order could not be submitted and the error confirmation state renders
- **THEN** no confetti and no celebratory styling SHALL be shown, and the existing recovery action ("Back to scheduling") SHALL remain.

### Requirement: Autopay enrollment SHALL be selected via a two-option segmented control

The Details step payment-preference section SHALL let the user choose between autopay and standard billing by clicking one of two adjacent option cards. The cards SHALL be ordered with **"With autopay" first (left)** and **"Standard" second (right)**, each showing its respective monthly price. **"With autopay" SHALL be selected by default** when the step first renders. These cards SHALL function as a single-select segmented control (radiogroup). Selecting "With autopay" SHALL enable autopay and reveal the phone-collection notice; selecting "Standard" SHALL disable autopay and hide that notice. Neither selection SHALL reveal any payment-instrument fields. The selected card SHALL be visually emphasized and the control SHALL be operable by keyboard with the autopay value kept in sync with the form state used at submission.

#### Scenario: Autopay is the default selection

- **WHEN** the Details step first renders for a new draft
- **THEN** the "With autopay" card (leftmost) SHALL be the emphasized selected option, autopay SHALL be enabled in the form state, and the phone-collection notice SHALL be revealed.

#### Scenario: Selecting the standard option

- **WHEN** the user clicks the "Standard" card (rightmost)
- **THEN** the card SHALL become the emphasized selected option, autopay SHALL be disabled in the form state, and the phone-collection notice SHALL be hidden.

#### Scenario: Keyboard operation and accessibility

- **WHEN** the user navigates the selector with the keyboard
- **THEN** the two options SHALL be exposed as a radiogroup with the active option reflected via `aria-checked` and SHALL be selectable without a pointer.

#### Scenario: Selection persists to submission

- **WHEN** the user picks an autopay option and submits the Details step
- **THEN** the value submitted to `finalizePhase2` SHALL match the selected card, and the submission SHALL carry only the autopay preference with no payment instrument.

### Requirement: Autopay enrollment SHALL collect payment by phone and never capture a payment instrument on the site

The checkout SHALL NOT collect, validate, transmit, or store any payment instrument — including card number, cardholder, expiration, CVV, and ACH routing/account/account-type. Autopay enrollment is a price preference only. When the user selects autopay, the Details step SHALL render a notice that a Mahalo agent will set up the payment method by phone, in place of any card or ACH input fields. The `finalizePhase2` server action SHALL accept only the autopay boolean and SHALL NOT accept or persist any payment instrument.

#### Scenario: Autopay selected shows a phone-collection notice, not payment fields

- **WHEN** the user selects "With autopay" in the Details step
- **THEN** the step SHALL display a notice that an agent will set up payment by phone
- **AND** no card number, cardholder, expiration, CVV, routing, or account field SHALL be rendered.

#### Scenario: Server action rejects payment instruments

- **WHEN** a request reaches `finalizePhase2`
- **THEN** the action SHALL persist only the autopay preference and the customer/address data
- **AND** SHALL NOT write any payment instrument to the order.

### Requirement: Order submission SHALL NOT require payment data

Order submission SHALL succeed for an autopay-enabled order without any stored payment instrument. The submission path SHALL NOT block on the presence of payment data.

#### Scenario: Submitting an autopay order with no payment instrument

- **WHEN** a complete draft with autopay enabled and no stored payment data is submitted
- **THEN** `submitOrder` SHALL transition the order to "Pending" and SHALL NOT return a "Payment details are missing" error.

### Requirement: Provider selection SHALL be a dedicated pre-Plan screen for multi-provider ZIPs

When two or more providers serve the draft's ZIP code, the wizard SHALL present a dedicated provider-selection screen at `/checkout/provider` BEFORE the Plan step. This screen is a pre-step: it SHALL NOT add a numbered phase to the stepper, which SHALL remain exactly four phases (Plan, Customize, Details, Installation). Choosing a provider SHALL persist `providerId` on the draft (clearing any previously selected `planId` and add-ons) and navigate to the Plan step, which SHALL then present only the chosen provider's plans. When exactly one provider serves the ZIP, the provider screen SHALL be skipped and that provider's plans SHALL render directly on the Plan step, unchanged. The plan accordion (collapsed per-provider cards on the Plan step) SHALL no longer be used.

#### Scenario: Multiple providers route through the provider screen
- **WHEN** the user enters checkout with a ZIP served by two or more providers
- **THEN** the system SHALL render the `/checkout/provider` screen listing each available provider as a selectable card
- **AND** the stepper SHALL still show four phases with "Plan" as the first.

#### Scenario: Choosing a provider narrows the Plan step
- **WHEN** the user selects a provider on the provider screen
- **THEN** the system SHALL persist `providerId`, clear any prior `planId` and add-on selection, and navigate to `/checkout/plan`
- **AND** the Plan step SHALL render only that provider's plans, with no provider accordion.

#### Scenario: Single provider skips the provider screen
- **WHEN** the user enters checkout with a ZIP served by exactly one provider
- **THEN** the system SHALL NOT render the provider screen and SHALL render that provider's plans directly on the Plan step.

#### Scenario: Direct access to the Plan step without a chosen provider in a multi-provider ZIP
- **WHEN** a session requests `/checkout/plan` for a multi-provider ZIP and the draft has no `providerId`
- **THEN** the server SHALL redirect to `/checkout/provider`.

#### Scenario: Provider screen is keyboard and screen-reader operable
- **WHEN** the user navigates the provider cards with the keyboard
- **THEN** each provider's selection control SHALL be focusable, operable without a pointer, and expose its name and teaser to assistive technology.

### Requirement: Consent disclaimer SHALL be presented as a mandatory modal on the plan/customize advance action

The wizard SHALL present the contact-consent disclaimer as a mandatory modal gated on the primary advance action of the plan-selection phase. The modal SHALL contain the provider-specific disclaimer copy (with the provider name interpolated where `[Provider]` appears) and a single **"Continue"** button; activating that button SHALL constitute the user's electronic signature and SHALL perform the advance action. There SHALL be no separate consent checkbox on this surface. The trigger button SHALL expose a "Click for details" tooltip. The disclaimer SHALL appear on the Customize step's "Continue" button when the provider has active add-ons, and otherwise on the Plan step's "Choose plan" button — never on both for the same draft. All disclaimer copy SHALL be in English (US market).

#### Scenario: Provider with add-ons shows the disclaimer at Customize
- **WHEN** the provider has active add-ons and the user clicks the "Continue" button on the Customize step
- **THEN** the system SHALL open the disclaimer modal with the provider name interpolated and SHALL NOT yet advance
- **AND** the Plan step's "Choose plan" action for that draft SHALL NOT open the disclaimer modal.

#### Scenario: Provider without add-ons shows the disclaimer at Plan
- **WHEN** the provider has no active add-ons and the user clicks "Choose plan" on the Plan step
- **THEN** the system SHALL open the disclaimer modal with the provider name interpolated and SHALL NOT yet advance.

#### Scenario: Continuing from the modal is the electronic signature
- **WHEN** the disclaimer modal is open and the user clicks its "Continue" button
- **THEN** the system SHALL perform the gated advance action (persisting the plan or add-on selection) and navigate to the next step.

#### Scenario: Dismissing the modal does not advance
- **WHEN** the disclaimer modal is open and the user dismisses it without clicking "Continue"
- **THEN** the system SHALL remain on the current step and SHALL NOT persist an advance.

### Requirement: Provider cards SHALL show a price-and-speed teaser

Each provider card on the provider-selection screen SHALL display a teaser summarizing that provider's offering without naming an individual plan: a starting price and a top speed. The starting price SHALL be `From $X/mo`, where X is the **lowest `priceAutopay`** among the provider's active plans. The top speed SHALL be rendered as `up to Y`, where Y is the value and unit of the provider's **fastest** active plan (the plan with the greatest normalized speed). The teaser SHALL also render the provider identity (the provider's card logo when present, otherwise the provider name in its `primaryColor` as a fallback). All teaser copy SHALL be in English (US market).

#### Scenario: Teaser shows cheapest autopay price and fastest speed
- **WHEN** a provider card renders on the provider-selection screen for a provider with active plans
- **THEN** it SHALL show `From $X/mo` using the lowest autopay price among that provider's plans
- **AND** it SHALL show `up to Y` using the value and unit of that provider's fastest plan
- **AND** it SHALL NOT name any specific plan in the teaser.

#### Scenario: Teaser shows provider identity
- **WHEN** a provider card renders on the provider-selection screen
- **THEN** it SHALL show the provider's card logo when `logoUrl` is set
- **AND** SHALL otherwise show the provider `name` in its `primaryColor` as the identity fallback.

### Requirement: Plan speed SHALL be rendered from a structured value and unit

Wherever a plan's speed is displayed in the checkout flow, it SHALL be rendered from the plan's structured speed value and unit (e.g. "300 Mbps", "2 Gbps") via a single shared formatting helper, not from a free-text speed string. Comparisons that determine a provider's fastest plan SHALL use a normalized speed measure so that gigabit speeds correctly outrank megabit speeds (e.g. 1 Gbps ranks above 940 Mbps).

#### Scenario: Plan card renders structured speed
- **WHEN** a plan card renders its speed
- **THEN** it SHALL display the plan's speed value followed by its unit (e.g. "500 Mbps", "2 Gbps").

#### Scenario: Fastest plan determined by normalized speed
- **WHEN** the system selects a provider's fastest plan for the teaser
- **THEN** it SHALL compare plans by normalized speed (megabit-equivalent) so a 1 Gbps plan ranks above a 500 Mbps plan.

### Requirement: Final checkout step SHALL capture the customer's preferred advisor-call window

The final checkout step (step 4, `/checkout/schedule`) SHALL let the customer choose a preferred day and time window for the advisor's confirmation call, and SHALL require explicit consent before the order can be submitted. The date picker (selectable Monday–Saturday, future dates only) and the time-window selector SHALL sit side by side within the same card (date on the left, windows on the right). The step SHALL NOT render a read-only order review card and SHALL NOT render an order-total panel. The consent control and the primary submit action SHALL be the last elements on the page, and the primary submit action SHALL be labeled **"Place order"**. The chosen window SHALL be persisted to the order as `preferredCallAt`, and the checkout SHALL NOT set the installation schedule (`scheduledAt`).

#### Scenario: Loading the final step
- **WHEN** the user enters the final step with a complete draft
- **THEN** the page SHALL render a single card containing the date picker (left) and the time-window selector (right), followed by the consent control and finally the "Place order" submit button
- **AND** the step copy SHALL describe the selection as choosing when the advisor should call, not as scheduling an installation
- **AND** no order-review card and no order-total panel SHALL be present.

#### Scenario: Submitting the order
- **WHEN** the user picks a valid call window, accepts the consent disclaimer, and clicks "Place order"
- **THEN** the system SHALL persist the chosen window to `preferredCallAt` and the consent proof, submit the order via the server action, and navigate to `/checkout/confirmation`
- **AND** the order's `scheduledAt` (installation) SHALL remain null.

### Requirement: The advisor-call window selector SHALL offer exactly four fixed time windows

The final step SHALL offer exactly four selectable call windows: **8–10 AM**, **10 AM–12 PM**, **2–4 PM**, and **5–8 PM**. No other times SHALL be selectable. The order SHALL persist only the **start hour** of the chosen window (one of `8`, `10`, `14`, `17`) in `preferredCallAt`. The **interval** form (e.g. "8 – 10 AM") SHALL be rendered ONLY inside the selector; wherever the preferred call window is displayed downstream (confirmation page, order email, webhook payload, admin order views) it SHALL render the **start hour** (e.g. "8:00 AM").

#### Scenario: Time-window options
- **WHEN** the call-window selector renders for a chosen date
- **THEN** it SHALL present exactly four options labeled "8 – 10 AM", "10 – 12 PM", "2 – 4 PM", and "5 – 8 PM"
- **AND** no other time options SHALL be present.

#### Scenario: Server rejects an out-of-set window
- **WHEN** a submission arrives with a start hour other than 8, 10, 14, or 17
- **THEN** the server action SHALL reject it with a user-facing error and SHALL NOT persist the call window.

#### Scenario: Start hour shown downstream
- **WHEN** the preferred call window is rendered on the confirmation page, in the order email, in the webhook payload, or in an admin order view
- **THEN** it SHALL display the window start hour (e.g. "8:00 AM") and SHALL NOT render the interval.

### Requirement: Order submission SHALL require a preferred call window

The order-finalization server action SHALL treat a draft as complete only when it has a persisted `preferredCallAt`. It SHALL NOT require `scheduledAt` (installation) to submit the order.

#### Scenario: Submit without a preferred call window
- **WHEN** the finalization server action runs for a draft that has no `preferredCallAt`
- **THEN** it SHALL return a user-facing error and SHALL NOT move the order out of `Draft`.

#### Scenario: Submit with a preferred call window and consent
- **WHEN** the finalization server action runs for a draft that has `preferredCallAt` and recorded consent proof
- **THEN** it SHALL materialize the order regardless of whether `scheduledAt` is set.

### Requirement: Installation scheduling SHALL be a back-office responsibility

After checkout, an order's installation schedule (`scheduledAt`) SHALL be null until an agent sets it in the back office. The admin order detail SHALL display the customer's preferred advisor-call window as read-only information alongside the editable installation schedule control. Installation time, when set, SHALL render as the window start hour wherever it is displayed downstream.

#### Scenario: New order has no installation schedule
- **WHEN** a customer completes checkout
- **THEN** the resulting order SHALL have a populated `preferredCallAt` and a null `scheduledAt`.

#### Scenario: Admin sees the preferred call window and edits installation
- **WHEN** an agent opens the order detail in the back office
- **THEN** the page SHALL show the customer's preferred call window as read-only text
- **AND** SHALL present the existing installation-scheduling control to set or change `scheduledAt`.

### Requirement: Coverage resolution SHALL treat fallback providers as last-resort, universal offerings

The provider availability resolution for a customer's ZIP SHALL distinguish fallback providers (those flagged `is_fallback`) from ordinary providers. Fallback providers SHALL be offered ONLY when no ordinary (non-fallback) active provider with at least one active plan covers the ZIP. When at least one ordinary provider qualifies, fallback providers SHALL be excluded from the results entirely, regardless of whether they have a matching coverage row. When no ordinary provider qualifies, every active fallback provider that has at least one active plan SHALL be offered, even if the ZIP is absent from that provider's `provider_coverage` rows (fallback providers are universal). Fallback providers SHALL still be subject to the existing "providers without active plans are not offered" rule. This requirement governs only the set of providers feeding the wizard; downstream routing (single-provider skip, multi-provider screen, empty state) operates on the resolved set unchanged.

#### Scenario: Ordinary provider exists — fallback excluded
- **WHEN** the ZIP is covered by at least one active non-fallback provider that has active plans
- **THEN** the resolved provider set SHALL contain only the qualifying non-fallback providers
- **AND** no fallback provider SHALL appear, even one whose `provider_coverage` includes that ZIP.

#### Scenario: No ordinary coverage — fallback surfaced universally
- **WHEN** no active non-fallback provider with active plans covers the ZIP
- **AND** at least one active fallback provider has active plans
- **THEN** the resolved provider set SHALL contain every qualifying fallback provider
- **AND** a fallback provider SHALL be included even when the ZIP is not present in its `provider_coverage` rows.

#### Scenario: Sole fallback skips the provider screen
- **WHEN** the resolved set contains exactly one provider (a fallback)
- **THEN** the wizard SHALL behave as for any single-provider ZIP, rendering that provider's plans directly on the Plan step without the provider-selection screen.

#### Scenario: Multiple fallbacks route through the provider screen
- **WHEN** the resolved set contains two or more fallback providers and no ordinary provider
- **THEN** the wizard SHALL render the `/checkout/provider` selection screen listing each fallback provider as a selectable card.

#### Scenario: Fallback without active plans is not offered
- **WHEN** no ordinary provider with active plans covers the ZIP
- **AND** the only fallback provider has no active plans
- **THEN** the resolved provider set SHALL be empty and the wizard SHALL render the no-coverage empty state.

#### Scenario: No coverage at all
- **WHEN** no active non-fallback provider with active plans covers the ZIP
- **AND** no active fallback provider with active plans exists
- **THEN** the resolved provider set SHALL be empty and the wizard SHALL render the no-coverage empty state.

### Requirement: ZIP availability SHALL be resolved from the database, not an external address service

Provider availability for a customer's ZIP SHALL be resolved solely from the application database (`provider_coverage` joined with `providers`, plus the fallback-provider rule). The resolution path SHALL NOT call an external postal/address service (USPS) to validate, normalize, or gate the ZIP. The only ZIP gate SHALL be the 5-digit format check (`/^\d{5}$/`) enforced at input time; a well-formed ZIP SHALL always reach database resolution. This requirement governs both draft creation (the ZIP search) and provider resolution feeding the wizard. The external address client MAY still be used by other flows (e.g. future Details-step address verification); this requirement constrains only the ZIP-availability path.

#### Scenario: Well-formed ZIP resolves from the database only

- **WHEN** a user submits a 5-digit ZIP and the system resolves available providers
- **THEN** the system SHALL query `provider_coverage`/`providers` (and the fallback rule) to build the provider set
- **AND** SHALL NOT call the USPS address service as part of that resolution.

#### Scenario: Well-formed but uncovered or unknown ZIP surfaces the fallback providers

- **WHEN** a user submits a 5-digit ZIP that no ordinary (non-fallback) active provider with active plans covers — including a ZIP that does not exist in any external postal database
- **THEN** the system SHALL resolve the active fallback provider(s) with active plans as the available set
- **AND** SHALL NOT return an address-lookup error (e.g. "We couldn't find that ZIP code") for that ZIP.

#### Scenario: Malformed ZIP is rejected before resolution

- **WHEN** a user submits a value that is not exactly five digits
- **THEN** the system SHALL reject it with a format validation message
- **AND** SHALL NOT create a draft or attempt provider resolution.

#### Scenario: Draft creation does not depend on an external address service

- **WHEN** `createDraftOrder` runs for a format-valid ZIP
- **THEN** it SHALL persist the draft with the validated ZIP and a null `installationAddress`
- **AND** SHALL NOT call the USPS address service
- **AND** an outage or rate-limit of that external service SHALL NOT block draft creation.

