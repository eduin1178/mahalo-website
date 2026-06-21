## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Installation step SHALL combine scheduling and final review in a single view

The Installation step (step 4, `/checkout/schedule`) SHALL let the user choose an installation date and time window, and SHALL require explicit consent before the order can be submitted. The date picker and the time-window selector SHALL sit side by side within the same card (date on the left, windows on the right). The step SHALL NOT render a read-only order review card and SHALL NOT render an order-total panel. The consent control and the primary submit action SHALL be the last elements on the page. The primary submit action SHALL be labeled **"Place order"**.

#### Scenario: Loading the Installation step
- **WHEN** the user enters the Installation step with a complete draft
- **THEN** the page SHALL render a single card containing the date picker (left) and the time-window selector (right), followed by the consent control and finally the "Place order" submit button
- **AND** no order-review card and no order-total panel SHALL be present
- **AND** no interactive control SHALL appear after the submit button.

#### Scenario: Submitting the order
- **WHEN** the user picks a valid time window, accepts the consent disclaimer, and clicks "Place order"
- **THEN** the system SHALL persist the consent proof and submit the order via the existing server action and navigate to `/checkout/confirmation`.

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

## REMOVED Requirements

### Requirement: Order total panel SHALL be visible on every phase except Plan

**Reason**: The client asked to remove the order-total summary from the checkout to declutter the funnel ahead of a future reframe toward scheduling a call. Running totals remain visible through the autopay segmented control on the Details step.

**Migration**: Delete the `OrderTotalPanel` from the checkout layout and collapse the layout to a single column on every phase. No data migration is required.

### Requirement: Plan step SHALL group results by provider

**Reason**: Provider selection is promoted to a dedicated pre-Plan screen for multi-provider ZIPs (see "Provider selection SHALL be a dedicated pre-Plan screen for multi-provider ZIPs"), so the Plan step no longer groups results or hosts a provider accordion.

**Migration**: Remove the accordion presentation from the Plan step. For multi-provider ZIPs the user chooses a provider on `/checkout/provider` first; the Plan step then renders only the chosen provider's plans. Single-provider ZIPs render plans directly as before.
