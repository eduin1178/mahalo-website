# Checkout Wizard Specification

## Purpose

Defines the public checkout wizard experience: a three-phase flow (Plan, Datos, Instalación) that lets a prospective customer choose a plan and add-ons, provide contact/address/payment information, and schedule installation, with a persistent order total panel, guarded navigation, legacy URL redirects, and English (US market) copy.
## Requirements
### Requirement: Checkout wizard SHALL present exactly three user-visible phases

The public checkout flow SHALL display a stepper with exactly three phases, in this order: **Plan**, **Datos**, **Instalación**. Transient routes (bootstrap loader, terminal confirmation page) SHALL NOT appear as steps in the stepper.

#### Scenario: User lands in the wizard after ZIP lookup
- **WHEN** a user with a valid draft enters `/checkout/plan`
- **THEN** the stepper SHALL render three chips labeled `Plan`, `Datos`, `Instalación` and mark `Plan` as active.

#### Scenario: Stepper hides bootstrap and confirmation
- **WHEN** the user is on `/checkout` (bootstrap) or `/checkout/confirmation` (terminal)
- **THEN** the stepper SHALL either be hidden or render without numbering those screens as part of the three-phase progression.

### Requirement: Phase 1 (Plan) SHALL combine plan selection and add-ons in a single view

The Phase 1 view SHALL allow the user to choose a plan and, when the chosen plan's provider offers active add-ons, select those add-ons in the same view without an intermediate navigation.

#### Scenario: Provider with active add-ons
- **WHEN** the user selects a plan whose provider has at least one active add-on
- **THEN** the add-ons selector SHALL render below the plan list in the same page without navigating away.

#### Scenario: Provider without add-ons
- **WHEN** the user selects a plan whose provider has zero active add-ons
- **THEN** the add-ons section SHALL NOT render and the user SHALL NOT be redirected through an intermediate page.

#### Scenario: Advancing from Phase 1
- **WHEN** the user has selected a plan and clicks "Continuar"
- **THEN** the system SHALL persist plan and selected add-ons to the draft and navigate to Phase 2.

#### Scenario: Attempting to advance without a plan
- **WHEN** the user clicks "Continuar" without selecting a plan
- **THEN** the system SHALL prevent navigation and display a validation message indicating that a plan selection is required.

### Requirement: Phase 2 (Datos) SHALL combine customer information and payment preference in a single view

The Phase 2 view SHALL capture contact information, installation address, billing address, autopay enrollment, and payment method in one page with sectioned layout.

#### Scenario: Loading Phase 2 with no prior data
- **WHEN** the user enters Phase 2 for the first time
- **THEN** the page SHALL render four sections (Contacto, Dirección de instalación, Dirección de facturación, Preferencia de pago) all editable.

#### Scenario: Loading Phase 2 with partial draft from legacy flow
- **WHEN** the draft already contains `customerId` but no `paymentData`
- **THEN** the contact and address sections SHALL pre-fill from the existing customer record and the payment section SHALL render empty without blocking the user.

#### Scenario: Advancing from Phase 2 with valid data
- **WHEN** the user clicks "Continuar" and all required fields across the four sections are valid
- **THEN** the system SHALL persist the data to the draft and navigate to Phase 3.

#### Scenario: Advancing from Phase 2 with invalid data
- **WHEN** the user clicks "Continuar" and one or more sections have validation errors
- **THEN** the system SHALL prevent navigation, display inline error messages, and scroll to the first section with errors.

### Requirement: Phase 3 (Instalación) SHALL combine scheduling and final review in a single view

The Phase 3 view SHALL allow the user to choose an installation date and time, SHALL show a consolidated, read-only summary of the order before submission, and SHALL require explicit consent (see "Final phase SHALL capture explicit consent before an order can be submitted") before the order can be submitted.

#### Scenario: Loading Phase 3

- **WHEN** the user enters Phase 3 with a complete draft
- **THEN** the page SHALL render the date/time picker followed by a read-only order summary including plan, add-ons, customer info, addresses, and total breakdown
- **AND** the page SHALL render the consent control adjacent to the submit control.

#### Scenario: Submitting the order

- **WHEN** the user picks a valid slot, accepts the consent disclaimer, and clicks "Confirm order"
- **THEN** the system SHALL persist the consent proof and submit the order via the existing server action and navigate to `/checkout/confirmation`.

#### Scenario: Editing data from Phase 3

- **WHEN** the user clicks an "Editar" affordance next to a summary section
- **THEN** the system SHALL navigate back to the corresponding earlier phase with the relevant section visible.

### Requirement: Order total SHALL be visible across all three phases via a persistent panel

The system SHALL render an `OrderTotalPanel` component on every wizard phase that displays the running cost breakdown computed from the current draft state.

#### Scenario: Panel placement on desktop
- **WHEN** the viewport is `lg` or wider
- **THEN** the panel SHALL appear as a sidebar adjacent to the main form area.

#### Scenario: Panel placement on mobile
- **WHEN** the viewport is narrower than `lg`
- **THEN** the panel SHALL appear as a sticky bottom bar that can be expanded to show the full breakdown.

#### Scenario: Panel with incomplete draft
- **WHEN** the draft does not yet have both `providerId` and `planId`
- **THEN** the panel SHALL render a placeholder message ("Elige un plan para ver el total") instead of invoking the totals calculation.

#### Scenario: Panel reflects add-on changes
- **WHEN** the user toggles an add-on selection in Phase 1
- **THEN** the panel SHALL update to reflect the new total before the user advances to the next phase.

### Requirement: Legacy checkout URLs SHALL redirect to the consolidated routes

Old routes (`/checkout/add-ons`, `/checkout/summary`, `/checkout/customer`, `/checkout/payment`) SHALL respond with a 302 redirect to the new consolidated route corresponding to the user's current draft state, preserving session cookies.

#### Scenario: Hitting a removed URL with an active draft
- **WHEN** an authenticated session with an active draft requests `/checkout/payment`
- **THEN** the server SHALL respond with a 302 redirect to `/checkout/details` and the draft SHALL remain intact.

#### Scenario: Hitting a removed URL without a draft
- **WHEN** a session without an active draft requests `/checkout/summary`
- **THEN** the server SHALL respond with a 302 redirect to `/` (home / ZIP lookup).

### Requirement: Navigation between phases SHALL be guarded by draft completeness

The system SHALL prevent direct navigation to a later phase if the draft does not contain the data required by all earlier phases.

#### Scenario: Direct access to Phase 3 without Phase 2 data
- **WHEN** a session attempts to access `/checkout/schedule` and the draft is missing `customerId`
- **THEN** the server SHALL redirect to `/checkout/details`.

#### Scenario: Direct access to Phase 2 without Phase 1 data
- **WHEN** a session attempts to access `/checkout/details` and the draft is missing `providerId` or `planId`
- **THEN** the server SHALL redirect to `/checkout/plan`.

#### Scenario: Direct access to Phase 1 without a draft
- **WHEN** a session attempts to access `/checkout/plan` and there is no active draft
- **THEN** the server SHALL redirect to `/`.

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

The Phase 2 form SHALL allow the user to submit and advance when autopay is disabled, without requiring or validating card/ACH payment fields. Card and ACH fields SHALL be validated strictly only when autopay is enabled and the corresponding payment method is selected. Empty card/ACH default values SHALL NOT produce hidden validation errors that prevent submission.

#### Scenario: Advancing with autopay off
- **WHEN** the user fills contact and installation address with valid data, leaves autopay disabled, and clicks the advance CTA
- **THEN** the form SHALL pass client validation, invoke `finalizePhase2`, and navigate to Phase 3 (`/checkout/schedule`).

#### Scenario: Advancing with autopay on and valid card
- **WHEN** the user enables autopay, selects the card method, and enters a valid card
- **THEN** the form SHALL pass client validation and advance, and the unused ACH fields SHALL NOT block submission.

#### Scenario: Advancing with autopay on and invalid payment data
- **WHEN** the user enables autopay and the selected payment method has invalid or missing data
- **THEN** the form SHALL prevent navigation and display inline validation errors in the visible payment section.

### Requirement: Plan cards SHALL emphasize the autopay price as the primary value

Each plan option in Phase 1 SHALL display the autopay price as the visually dominant value with a "with autopay" label, and the standard price SHALL be shown as a smaller, secondary value.

#### Scenario: Plan card pricing hierarchy
- **WHEN** a plan card renders its pricing
- **THEN** the autopay price SHALL be the largest pricing element with a "with autopay" label
- **AND** the standard price SHALL be rendered smaller and visually secondary.

### Requirement: Final phase SHALL capture explicit consent before an order can be submitted

The final checkout phase (`/checkout/schedule`) SHALL present a single consent control, positioned next to the order-submission control on the same page, that the user MUST affirmatively accept before the order can be submitted. The consent control SHALL combine acceptance of the Terms of Service and the Privacy Policy with an opt-in authorizing Mahalo and its authorized partners to contact the customer to process and activate the order. The consent text SHALL link to `/legal/terms` and `/legal/privacy`, SHALL be in English (US market), and the control SHALL NOT be pre-checked.

#### Scenario: Consent control is rendered next to the submit control

- **WHEN** the user enters the final phase with a complete draft
- **THEN** the page SHALL render an unchecked consent checkbox on the same page as, and adjacent to, the "Confirm order" control
- **AND** the consent text SHALL include inline links to the Terms of Service (`/legal/terms`) and the Privacy Policy (`/legal/privacy`).

#### Scenario: Consent is not pre-checked

- **WHEN** the final phase first renders
- **THEN** the consent checkbox SHALL be unchecked
- **AND** the "Confirm order" control SHALL be disabled until a valid slot is chosen AND the consent checkbox is checked.

#### Scenario: Attempting to submit without consent (client)

- **WHEN** the user has chosen a valid slot but the consent checkbox is unchecked and attempts to submit
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

### Requirement: Plan cards SHALL lay out at most two per row

The Phase 1 plan grid SHALL render at most **two** plan cards per row at any viewport width, so cards stay wide enough to read comfortably. Narrower viewports MAY collapse to a single column.

#### Scenario: Large viewport

- **WHEN** the Phase 1 plan list renders on a large (desktop) viewport
- **THEN** the grid SHALL show no more than two plan cards per row.

#### Scenario: Small viewport

- **WHEN** the Phase 1 plan list renders on a narrow (mobile) viewport
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

The Phase 1 plan cards and add-ons selector, each Phase 2 (Details) section (contact, installation address, billing, payment), and each Phase 3 (Instalación) section (choose a day, choose a time, consent, and the order review summary), SHALL be presented on the same elevated "premium" card surface used by the landing plan highlights (rounded, soft-shadowed, with a light decorative accent), so the checkout reads as one cohesive, premium experience. Containers that are not themselves selectable (the add-ons selector and the Phase 2/Phase 3 form and review sections) SHALL NOT apply the hover-lift reserved for selectable plan cards. An address block embedded inside another section (billing inside the billing section) SHALL NOT be double-wrapped in its own card.

#### Scenario: Phase 1 surfaces

- **WHEN** Phase 1 renders
- **THEN** the plan cards and the add-ons selector SHALL use the premium card surface, and the add-ons selector SHALL NOT lift on hover.

#### Scenario: Phase 2 surfaces

- **WHEN** Phase 2 renders
- **THEN** the contact, installation address, billing, and payment sections SHALL each be a premium card, and the optional billing address embedded in the billing section SHALL NOT be wrapped in a second card.

#### Scenario: Phase 3 surfaces

- **WHEN** Phase 3 (schedule) renders
- **THEN** the "choose a day", "choose a time", consent, and "review your order" sections SHALL each use the premium card surface and SHALL NOT lift on hover.

### Requirement: The primary advance action SHALL be a prominent button

Each checkout step's primary advance action ("Continue" in Phases 1–2, "Confirm order" in Phase 3) SHALL be rendered as a large primary button (full-width on mobile) so it is clearly the main action of the step.

#### Scenario: Continue button prominence

- **WHEN** a checkout step that has a "Continue" action renders
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

#### Scenario: Confirm order button prominence

- **WHEN** Phase 3 (schedule) renders its "Confirm order" action
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

### Requirement: The payment-method selector SHALL be a clearly selectable segmented control

When autopay is enabled, the Card / Bank (ACH) selector SHALL render as a segmented control whose track is visually defined and whose active option is clearly emphasized (distinct background, heavier text weight, and elevation), so it is obvious both that the options are switchable and which one is currently selected.

#### Scenario: Autopay enabled shows an emphasized active method

- **WHEN** autopay is enabled
- **THEN** the Card and Bank (ACH) options SHALL appear as a segmented control on a defined track
- **AND** the currently selected option SHALL be visually emphasized relative to the unselected option.

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

