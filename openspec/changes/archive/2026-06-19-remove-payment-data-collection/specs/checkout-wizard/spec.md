## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Details step SHALL combine customer information and payment preference in a single view

The Details step (step 3, `/checkout/details`) SHALL capture contact information, installation address, billing address, and autopay enrollment (a price preference only) in one page with sectioned layout, and SHALL show the order-total panel. The step SHALL NOT capture a payment method (card or ACH).

#### Scenario: Loading Details with no prior data
- **WHEN** the user enters the Details step for the first time
- **THEN** the page SHALL render the contact, installation address, billing address, and autopay-preference sections, all editable.

#### Scenario: Advancing from Details with valid data
- **WHEN** the user clicks the primary action and all required fields are valid
- **THEN** the system SHALL persist the data to the draft and navigate to the Installation step (`/checkout/schedule`).

#### Scenario: Advancing from Details with invalid data
- **WHEN** the user clicks the primary action and one or more sections have validation errors
- **THEN** the system SHALL prevent navigation, display inline error messages, and scroll to the first section with errors.

### Requirement: Phase 2 client validation SHALL NOT block advancing when autopay is disabled

The Phase 2 form SHALL allow the user to submit and advance regardless of the autopay selection, without requiring or validating any payment fields. The form SHALL NOT contain card or ACH fields, so neither the autopay-on nor the autopay-off path SHALL produce hidden validation errors that prevent submission.

#### Scenario: Advancing with autopay off
- **WHEN** the user fills contact and installation address with valid data, leaves autopay disabled, and clicks the advance CTA
- **THEN** the form SHALL pass client validation, invoke `finalizePhase2`, and navigate to Phase 3 (`/checkout/schedule`).

#### Scenario: Advancing with autopay on
- **WHEN** the user enables autopay and clicks the advance CTA with valid contact and address data
- **THEN** the form SHALL pass client validation and advance, with no payment field gating submission.

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

## REMOVED Requirements

### Requirement: The payment-method selector SHALL be a clearly selectable segmented control

**Reason**: The site no longer collects a payment instrument. Card/ACH data is collected over the phone by an agent, so there is no Card / Bank (ACH) selector to render.

**Migration**: Selecting autopay now reveals a notice that an agent will set up payment by phone (see "Autopay enrollment SHALL collect payment by phone and never capture a payment instrument on the site"). No data migration is required for in-flight drafts; existing stored payment data is dropped with the `orders.payment_data` column.
