## ADDED Requirements

### Requirement: Checkout wizard SHALL present exactly four user-visible phases

The public checkout flow SHALL display a stepper with exactly four phases, in this order: **Plan**, **Customize**, **Details**, **Installation**. Transient routes (bootstrap loader, terminal confirmation page) SHALL NOT appear as steps in the stepper.

#### Scenario: User lands in the wizard after ZIP lookup
- **WHEN** a user with a valid draft enters `/checkout/plan`
- **THEN** the stepper SHALL render four chips labeled `Plan`, `Customize`, `Details`, `Installation` and mark `Plan` as active.

#### Scenario: Stepper hides bootstrap and confirmation
- **WHEN** the user is on `/checkout` (bootstrap) or `/checkout/confirmation` (terminal)
- **THEN** the stepper SHALL either be hidden or render without numbering those screens as part of the four-phase progression.

### Requirement: Plan step SHALL present only plan selection

The Plan step (step 1, `/checkout/plan`) SHALL present plan selection ONLY. It SHALL NOT render the add-ons selector and SHALL NOT render the order-total panel; with the panel absent, the plan grid SHALL span the full content width (the summary column SHALL NOT be reserved). Choosing a plan SHALL immediately persist it to the draft and advance to the next step — there SHALL be no separate confirm/continue button on this step.

#### Scenario: Plan step shows no add-ons and spans full width
- **WHEN** the Plan step renders
- **THEN** the page SHALL NOT render an add-ons selector
- **AND** the order-total panel SHALL NOT be rendered and SHALL NOT reserve a column, so the plan grid uses the full content width.

#### Scenario: Choosing a plan advances immediately
- **WHEN** the user clicks a plan card's "Choose plan" action
- **THEN** the system SHALL persist that plan to the draft and navigate to the next step (Customize, or Details when the provider has no add-ons) without requiring any further confirmation action.

### Requirement: Customize step SHALL host add-ons and auto-skip when none exist

The Customize step (step 2, `/checkout/customize`) SHALL host the add-ons selector for the selected plan's provider and SHALL show the order-total panel. When the selected plan's provider has zero active add-ons, the step SHALL be skipped automatically via a server-side redirect to the Details step, so the user never sees an empty Customize page.

#### Scenario: Provider with active add-ons
- **WHEN** the user reaches `/checkout/customize` and the selected plan's provider has at least one active add-on
- **THEN** the add-ons selector SHALL render with the order-total panel
- **AND** the primary action SHALL persist the selected add-ons to the draft and advance to the Details step.

#### Scenario: Provider without add-ons auto-skips
- **WHEN** the user reaches `/checkout/customize` and the selected plan's provider has zero active add-ons
- **THEN** the server SHALL redirect to `/checkout/details` without rendering an empty Customize page.

#### Scenario: Customize without a selected plan
- **WHEN** a session requests `/checkout/customize` and the draft is missing `providerId` or `planId`
- **THEN** the server SHALL redirect to `/checkout/plan`.

### Requirement: Details step SHALL combine customer information and payment preference in a single view

The Details step (step 3, `/checkout/details`) SHALL capture contact information, installation address, billing address, autopay enrollment, and payment method in one page with sectioned layout, and SHALL show the order-total panel.

#### Scenario: Loading Details with no prior data
- **WHEN** the user enters the Details step for the first time
- **THEN** the page SHALL render the contact, installation address, billing address, and payment-preference sections, all editable.

#### Scenario: Advancing from Details with valid data
- **WHEN** the user clicks the primary action and all required fields are valid
- **THEN** the system SHALL persist the data to the draft and navigate to the Installation step (`/checkout/schedule`).

#### Scenario: Advancing from Details with invalid data
- **WHEN** the user clicks the primary action and one or more sections have validation errors
- **THEN** the system SHALL prevent navigation, display inline error messages, and scroll to the first section with errors.

### Requirement: Installation step SHALL combine scheduling and final review in a single view

The Installation step (step 4, `/checkout/schedule`) SHALL let the user choose an installation date and time window, SHALL show the order-total panel, SHALL show a consolidated read-only review of the order before submission, and SHALL require explicit consent before the order can be submitted. The date picker and the time-window selector SHALL sit side by side within the same card (date on the left, windows on the right). The read-only review SHALL render after the date/time selection and before the consent control, so the consent control and the primary submit action are the last elements on the page. The primary submit action SHALL be labeled **"Place order"**.

#### Scenario: Loading the Installation step
- **WHEN** the user enters the Installation step with a complete draft
- **THEN** the page SHALL render a single card containing the date picker (left) and the time-window selector (right), followed by the read-only order review, the consent control, and finally the "Place order" submit button
- **AND** no interactive control SHALL appear after the submit button.

#### Scenario: Submitting the order
- **WHEN** the user picks a valid time window, accepts the consent disclaimer, and clicks "Place order"
- **THEN** the system SHALL persist the consent proof and submit the order via the existing server action and navigate to `/checkout/confirmation`.

#### Scenario: Editing data from the Installation step
- **WHEN** the user clicks an "Edit" affordance next to a review section
- **THEN** the system SHALL navigate back to the corresponding earlier step with the relevant section visible.

### Requirement: Installation scheduling SHALL offer exactly three fixed time windows

The Installation step SHALL offer exactly three selectable installation time windows: **8–10 AM**, **10 AM–12 PM**, and **2–4 PM**. No other times SHALL be selectable. The hourly 8:00–17:00 list SHALL NOT be offered.

#### Scenario: Time-window options
- **WHEN** the time-window selector renders for a chosen date
- **THEN** it SHALL present exactly three options labeled "8 – 10 AM", "10 – 12 PM", and "2 – 4 PM"
- **AND** no other time options SHALL be present.

#### Scenario: Server rejects an out-of-set window
- **WHEN** a schedule submission arrives with a start hour other than 8, 10, or 14
- **THEN** the server action SHALL reject it with a user-facing error and SHALL NOT schedule the installation.

### Requirement: Installation time SHALL persist the window start hour and render as an interval only in the scheduling step

The order SHALL persist only the **start hour** of the chosen installation window (one of `8`, `10`, `14`). Wherever the installation time is displayed — the confirmation page, the order email, the n8n webhook payload, and admin order views — it SHALL render the **start hour**. The two-hour **interval** form (`start`–`start+2h`, e.g. "8 – 10 AM") SHALL be rendered ONLY inside the Installation step's time-window selector and its read-only review card.

#### Scenario: Interval shown in the scheduling step and its review
- **WHEN** the Installation step renders the time-window selector and the read-only review of the chosen slot
- **THEN** both SHALL display the two-hour interval (e.g. "8 – 10 AM").

#### Scenario: Start hour shown downstream
- **WHEN** the installation time is rendered on the confirmation page, in the order email, in the webhook payload, or in an admin order view
- **THEN** it SHALL display the window start hour (e.g. "8:00 AM") and SHALL NOT render the interval.

### Requirement: Order total panel SHALL be visible on every phase except Plan

The system SHALL render the `OrderTotalPanel` on the Customize, Details, and Installation phases, displaying the running cost breakdown computed from the current draft. The panel SHALL NOT be rendered on the Plan phase. The panel SHALL stay consistent with the persisted draft across phase transitions.

#### Scenario: Panel hidden on Plan
- **WHEN** the Plan phase renders
- **THEN** the order-total panel SHALL NOT be present, and the plan grid SHALL use the full content width.

#### Scenario: Panel placement on desktop
- **WHEN** the viewport is `lg` or wider on the Customize, Details, or Installation phase
- **THEN** the panel SHALL appear as a sidebar adjacent to the main form area.

#### Scenario: Panel placement on mobile
- **WHEN** the viewport is narrower than `lg` on the Customize, Details, or Installation phase
- **THEN** the panel SHALL appear as a sticky bottom bar that can be expanded to show the full breakdown.

#### Scenario: Panel reflects selections after advancing a phase
- **WHEN** the user selects a plan on the Plan phase and the wizard navigates onward
- **THEN** the panel on the Customize/Details phases SHALL display the chosen plan and its computed total.

### Requirement: Plan cards SHALL lay out at most three per row

The Plan step grid SHALL render at most **three** plan cards per row on large viewports, so the grid uses the width freed by hiding the order-total panel. Narrower viewports MAY collapse to two columns or a single column.

#### Scenario: Large viewport
- **WHEN** the Plan step grid renders on a large (desktop) viewport
- **THEN** the grid SHALL show up to three plan cards per row.

#### Scenario: Small viewport
- **WHEN** the Plan step grid renders on a narrow (mobile) viewport
- **THEN** the grid SHALL collapse to a single column.

## MODIFIED Requirements

### Requirement: Autopay enrollment SHALL be selected via a two-option segmented control

The Details step payment-preference section SHALL let the user choose between autopay and standard billing by clicking one of two adjacent option cards. The cards SHALL be ordered with **"With autopay" first (left)** and **"Standard" second (right)**, each showing its respective monthly price. **"With autopay" SHALL be selected by default** when the step first renders. These cards SHALL function as a single-select segmented control (radiogroup). Selecting "With autopay" SHALL enable autopay and reveal the payment-method form; selecting "Standard" SHALL disable autopay and hide the payment-method form. The selected card SHALL be visually emphasized and the control SHALL be operable by keyboard with the autopay value kept in sync with the form state used at submission.

#### Scenario: Autopay is the default selection
- **WHEN** the Details step first renders for a new draft
- **THEN** the "With autopay" card (leftmost) SHALL be the emphasized selected option, autopay SHALL be enabled in the form state, and the payment-method form SHALL be revealed.

#### Scenario: Selecting the standard option
- **WHEN** the user clicks the "Standard" card (rightmost)
- **THEN** the card SHALL become the emphasized selected option, autopay SHALL be disabled in the form state, and the payment-method form SHALL be hidden.

#### Scenario: Keyboard operation and accessibility
- **WHEN** the user navigates the selector with the keyboard
- **THEN** the two options SHALL be exposed as a radiogroup with the active option reflected via `aria-checked` and SHALL be selectable without a pointer.

#### Scenario: Selection persists to submission
- **WHEN** the user picks an autopay option and submits the Details step
- **THEN** the value submitted to `finalizePhase2` SHALL match the selected card, and autopay-on submissions SHALL still require a valid payment method.

### Requirement: Final phase SHALL capture explicit consent before an order can be submitted

The final checkout phase (`/checkout/schedule`) SHALL present a single consent control, positioned next to the order-submission control on the same page, that the user MUST affirmatively accept before the order can be submitted. The consent control SHALL combine acceptance of the Terms of Service and the Privacy Policy with an opt-in authorizing Mahalo and its authorized partners to contact the customer to process and activate the order. The consent text SHALL link to `/legal/terms` and `/legal/privacy`, SHALL be in English (US market), and the control SHALL NOT be pre-checked.

#### Scenario: Consent control is rendered next to the submit control
- **WHEN** the user enters the final phase with a complete draft
- **THEN** the page SHALL render an unchecked consent checkbox on the same page as, and adjacent to, the "Place order" control
- **AND** the consent text SHALL include inline links to the Terms of Service (`/legal/terms`) and the Privacy Policy (`/legal/privacy`).

#### Scenario: Consent is not pre-checked
- **WHEN** the final phase first renders
- **THEN** the consent checkbox SHALL be unchecked
- **AND** the "Place order" control SHALL be disabled until a valid time window is chosen AND the consent checkbox is checked.

#### Scenario: Attempting to submit without consent (client)
- **WHEN** the user has chosen a valid time window but the consent checkbox is unchecked and attempts to submit
- **THEN** the system SHALL prevent submission and display a validation message indicating consent is required.

#### Scenario: Attempting to submit without consent (server)
- **WHEN** a submission reaches the server action without recorded consent
- **THEN** the server action SHALL reject the submission with a user-facing error and SHALL NOT advance the order.

### Requirement: The primary advance action SHALL be a prominent button

The Customize and Details steps' primary advance action ("Continue") and the Installation step's ("Place order") SHALL be rendered as a large primary button (full-width on mobile) so it is clearly the main action of the step. The Plan step is exempt: it advances by choosing a plan card and SHALL NOT render a separate advance button.

#### Scenario: Advance button prominence
- **WHEN** the Customize or Details step renders its "Continue" action
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

#### Scenario: Place order button prominence
- **WHEN** the Installation step renders its "Place order" action
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

### Requirement: Completed steps SHALL be navigable from the stepper

The stepper SHALL let the user return to any already-completed step by clicking that step's indicator. A completed step (one before the current step) SHALL be an interactive control that navigates to that step's route. The current step and not-yet-reached steps SHALL NOT be interactive.

#### Scenario: Clicking a completed step navigates back
- **WHEN** the user is on a later step and clicks the indicator of an earlier, completed step
- **THEN** the system SHALL navigate to that earlier step's route (subject to the existing draft-completeness guards).

#### Scenario: Current and future steps are not interactive
- **WHEN** the stepper renders the current step and steps not yet reached
- **THEN** those indicators SHALL NOT be clickable navigation controls.

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
- **THEN** the combined date-and-time-window card, the consent control, and the order review SHALL each use the premium card surface and SHALL NOT lift on hover.

## REMOVED Requirements

### Requirement: Checkout wizard SHALL present exactly three user-visible phases
**Reason**: Replaced by a four-phase flow (Plan, Customize, Details, Installation).
**Migration**: See ADDED "Checkout wizard SHALL present exactly four user-visible phases".

### Requirement: Phase 1 (Plan) SHALL combine plan selection and add-ons in a single view
**Reason**: Add-ons move to a dedicated, auto-skippable Customize step; the Plan step now shows plan selection only.
**Migration**: See ADDED "Plan step SHALL present only plan selection" and "Customize step SHALL host add-ons and auto-skip when none exist".

### Requirement: Phase 2 (Datos) SHALL combine customer information and payment preference in a single view
**Reason**: Renumbered to the Details step (step 3) with a Customize step now preceding it.
**Migration**: See ADDED "Details step SHALL combine customer information and payment preference in a single view".

### Requirement: Phase 3 (Instalación) SHALL combine scheduling and final review in a single view
**Reason**: Renumbered to the Installation step (step 4) and reworked: date and time windows now share one card, scheduling offers three fixed windows, and the submit label is "Place order".
**Migration**: See ADDED "Installation step SHALL combine scheduling and final review in a single view", "Installation scheduling SHALL offer exactly three fixed time windows", and "Installation time SHALL persist the window start hour and render as an interval only in the scheduling step".

### Requirement: Order total SHALL be visible across all three phases via a persistent panel
**Reason**: The order-total panel is now hidden on the Plan step (to free width for the three-per-row grid) and shown on the other three phases.
**Migration**: See ADDED "Order total panel SHALL be visible on every phase except Plan".

### Requirement: Plan cards SHALL lay out at most two per row
**Reason**: The Plan step hides the order-total panel, freeing width for a three-per-row grid.
**Migration**: See ADDED "Plan cards SHALL lay out at most three per row".
