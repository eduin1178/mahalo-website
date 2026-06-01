## MODIFIED Requirements

### Requirement: All user-facing copy in the wizard SHALL be in English (US market)

Every label, button, placeholder, validation message, error, empty state, success state, tooltip, and visible aria-label rendered to the end user across the live checkout flow (Plan, Details, Schedule, Confirmation) SHALL be in English. This includes Zod validation messages, phone-type labels, and the user-facing `error` strings returned by the checkout server actions (`createDraftOrder`, `finalizePhase1`, `finalizePhase2`, `scheduleInstallation`). This requirement supersedes the previous neutral-Spanish requirement and is scoped to this project, which serves a US market; a corresponding project-level override SHALL be documented in `AGENTS.md`.

#### Scenario: CTA labels

- **WHEN** the wizard renders a primary call-to-action to advance phases
- **THEN** the label SHALL be in English (e.g., "Continue", "Confirm order")

#### Scenario: Validation messages

- **WHEN** a form field fails validation
- **THEN** the message SHALL be in English (e.g., "Enter a valid ZIP", "Required")

#### Scenario: Server action errors

- **WHEN** a checkout server action returns a user-facing error
- **THEN** the message SHALL be in English (e.g., "Your session expired. Start over.", "Choose a plan first.")

#### Scenario: Phone-type labels

- **WHEN** the contact section renders the phone-type options
- **THEN** the labels SHALL read "Mobile", "Home", and "Work"

## ADDED Requirements

### Requirement: Phase 2 client validation SHALL NOT block advancing when autopay is disabled

The Phase 2 form SHALL allow the user to submit and advance when autopay is disabled, without requiring or validating card/ACH payment fields. Card and ACH fields SHALL be validated strictly only when autopay is enabled and the corresponding payment method is selected. Empty card/ACH default values SHALL NOT produce hidden validation errors that prevent submission.

#### Scenario: Advancing with autopay off

- **WHEN** the user fills contact and installation address with valid data, leaves autopay disabled, and clicks the advance CTA
- **THEN** the form SHALL pass client validation, invoke `finalizePhase2`, and navigate to Phase 3 (`/checkout/schedule`)

#### Scenario: Advancing with autopay on and valid card

- **WHEN** the user enables autopay, selects the card method, and enters a valid card
- **THEN** the form SHALL pass client validation and advance, and the unused ACH fields SHALL NOT block submission

#### Scenario: Advancing with autopay on and invalid payment data

- **WHEN** the user enables autopay and the selected payment method has invalid or missing data
- **THEN** the form SHALL prevent navigation and display inline validation errors in the visible payment section

### Requirement: Plan cards SHALL emphasize the autopay price as the primary value

Each plan option in Phase 1 SHALL display the autopay price as the visually dominant value with a "with autopay" label, and the standard price SHALL be shown as a smaller, secondary value.

#### Scenario: Plan card pricing hierarchy

- **WHEN** a plan card renders its pricing
- **THEN** the autopay price SHALL be the largest pricing element with a "with autopay" label
- **AND** the standard price SHALL be rendered smaller and visually secondary
