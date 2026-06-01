## ADDED Requirements

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

## MODIFIED Requirements

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
