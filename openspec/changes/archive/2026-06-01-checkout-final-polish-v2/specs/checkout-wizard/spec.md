## MODIFIED Requirements

### Requirement: Phase 3 (Instalación) SHALL combine scheduling and final review in a single view

The Phase 3 view SHALL allow the user to choose an installation date and time, SHALL show a consolidated, read-only summary of the order before submission, and SHALL require explicit consent (see "Final phase SHALL capture explicit consent before an order can be submitted") before the order can be submitted. The read-only summary SHALL render **after** the date/time selection and **before** the consent control, so that the consent control and the primary submit action are the last elements on the page.

#### Scenario: Loading Phase 3

- **WHEN** the user enters Phase 3 with a complete draft
- **THEN** the page SHALL render the controls in this order: the date picker, the time picker, the read-only order summary (plan, add-ons, customer info, addresses, payment, and total breakdown), the consent control, and finally the "Confirm order" submit button
- **AND** no interactive control SHALL appear after the submit button.

#### Scenario: Submitting the order

- **WHEN** the user picks a valid slot, accepts the consent disclaimer, and clicks "Confirm order"
- **THEN** the system SHALL persist the consent proof and submit the order via the existing server action and navigate to `/checkout/confirmation`.

#### Scenario: Editing data from Phase 3

- **WHEN** the user clicks an "Editar" affordance next to a summary section
- **THEN** the system SHALL navigate back to the corresponding earlier phase with the relevant section visible.

### Requirement: Order total SHALL be visible across all three phases via a persistent panel

The system SHALL render an `OrderTotalPanel` component on every wizard phase that displays the running cost breakdown computed from the current draft state. The panel SHALL stay consistent with the persisted draft across phase transitions: after a phase advances the draft (via a server action), the panel SHALL reflect the updated draft on the destination phase, not a stale earlier render.

#### Scenario: Panel placement on desktop
- **WHEN** the viewport is `lg` or wider
- **THEN** the panel SHALL appear as a sidebar adjacent to the main form area.

#### Scenario: Panel placement on mobile
- **WHEN** the viewport is narrower than `lg`
- **THEN** the panel SHALL appear as a sticky bottom bar that can be expanded to show the full breakdown.

#### Scenario: Panel with incomplete draft
- **WHEN** the draft does not yet have both `providerId` and `planId`
- **THEN** the panel SHALL render a placeholder message ("Choose a plan to see the total") instead of invoking the totals calculation.

#### Scenario: Panel reflects add-on changes
- **WHEN** the user toggles an add-on selection in Phase 1
- **THEN** the panel SHALL update to reflect the new total before the user advances to the next phase.

#### Scenario: Panel reflects selections after advancing a phase
- **WHEN** the user selects a plan in Phase 1 and the wizard navigates to Phase 2
- **THEN** the panel on Phase 2 SHALL display the chosen plan and its computed total instead of the "Choose a plan" placeholder.

#### Scenario: Panel reflects payment preference after advancing to Phase 3
- **WHEN** the user enables autopay in Phase 2 and the wizard navigates to Phase 3
- **THEN** the panel on Phase 3 SHALL reflect the autopay total consistent with the persisted draft.

## ADDED Requirements

### Requirement: Autopay enrollment SHALL be selected via a two-option segmented control

The Phase 2 payment-preference section SHALL let the user choose between standard billing and autopay by clicking one of two adjacent option cards labelled "Standard" and "With autopay", each showing its respective monthly price. These cards SHALL function as a single-select segmented control (radiogroup). The previous header toggle switch SHALL be removed. Selecting "With autopay" SHALL enable autopay and reveal the payment-method form; selecting "Standard" SHALL disable autopay and hide the payment-method form. The selected card SHALL be visually emphasized and the control SHALL be operable by keyboard with the autopay value kept in sync with the form state used at submission.

#### Scenario: Selecting the autopay option

- **WHEN** the user clicks the "With autopay" card
- **THEN** the card SHALL become the emphasized selected option, autopay SHALL be enabled in the form state, and the payment-method form (Card / Bank ACH) SHALL be revealed.

#### Scenario: Selecting the standard option

- **WHEN** the user clicks the "Standard" card
- **THEN** the card SHALL become the emphasized selected option, autopay SHALL be disabled in the form state, and the payment-method form SHALL be hidden.

#### Scenario: Keyboard operation and accessibility

- **WHEN** the user navigates the selector with the keyboard
- **THEN** the two options SHALL be exposed as a radiogroup with the active option reflected via `aria-checked` and SHALL be selectable without a pointer.

#### Scenario: Selection persists to submission

- **WHEN** the user picks an autopay option and submits Phase 2
- **THEN** the value submitted to `finalizePhase2` SHALL match the selected card, and autopay-on submissions SHALL still require a valid payment method.
