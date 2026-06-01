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

The Phase 3 view SHALL allow the user to choose an installation date and time and SHALL show a consolidated, read-only summary of the order before submission.

#### Scenario: Loading Phase 3
- **WHEN** the user enters Phase 3 with a complete draft
- **THEN** the page SHALL render the date/time picker followed by a read-only order summary including plan, add-ons, customer info, addresses, and total breakdown.

#### Scenario: Submitting the order
- **WHEN** the user picks a valid slot and clicks "Confirmar pedido"
- **THEN** the system SHALL submit the order via the existing server action and navigate to `/checkout/confirmation`.

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
