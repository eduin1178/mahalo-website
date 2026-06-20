## MODIFIED Requirements

### Requirement: Plan step SHALL present only plan selection

The Plan step (step 1, `/checkout/plan`) SHALL present plan selection ONLY. It SHALL NOT render the add-ons selector and SHALL NOT render the order-total panel; with the panel absent, the content SHALL span the full content width (the summary column SHALL NOT be reserved). Results SHALL be organized by provider (see "Plan step SHALL group results by provider"). Choosing a plan SHALL immediately persist it to the draft and advance to the next step — there SHALL be no separate confirm/continue button on this step, and revealing a provider's plans SHALL NOT count as a wizard step.

#### Scenario: Plan step shows no add-ons and spans full width
- **WHEN** the Plan step renders
- **THEN** the page SHALL NOT render an add-ons selector
- **AND** the order-total panel SHALL NOT be rendered and SHALL NOT reserve a column, so the content uses the full content width.

#### Scenario: Choosing a plan advances immediately
- **WHEN** the user clicks a plan card's "Choose plan" action
- **THEN** the system SHALL persist that plan to the draft and navigate to the next step (Customize, or Details when the provider has no add-ons) without requiring any further confirmation action.

## ADDED Requirements

### Requirement: Plan step SHALL group results by provider

The Plan step SHALL present coverage results grouped by provider rather than as a flat list of all plans. The presentation SHALL depend on how many providers serve the draft's ZIP code:

- When **exactly one** provider is available, that provider's plans SHALL render directly (expanded), with no collapsed provider card and no extra interaction required to see them.
- When **two or more** providers are available, each provider SHALL be presented as a collapsed, full-content-width card; the provider's plans SHALL be revealed only when the user expands that card (accordion), and SHALL be hidden again when the card is collapsed.

The accordion SHALL allow expanding a provider's plans in place without navigating away from the Plan step. When no provider is available for the ZIP, the existing empty/no-coverage state SHALL be shown.

#### Scenario: Single provider renders plans directly
- **WHEN** the Plan step renders and exactly one provider serves the ZIP
- **THEN** that provider's plans SHALL be visible without any expand interaction
- **AND** no collapsed provider card SHALL be shown.

#### Scenario: Multiple providers render as collapsed cards
- **WHEN** the Plan step renders and two or more providers serve the ZIP
- **THEN** each provider SHALL render as a collapsed full-width card
- **AND** the providers' plan grids SHALL NOT be visible until a card is expanded.

#### Scenario: Expanding a provider card reveals its plans
- **WHEN** the user activates (clicks or keyboard-activates) a collapsed provider card
- **THEN** that card SHALL expand to reveal the provider's plans with their "Choose plan" actions
- **AND** the expansion SHALL occur in place on the Plan step without adding a wizard step or navigating away.

#### Scenario: Provider card is keyboard and screen-reader operable
- **WHEN** the user navigates the provider cards with the keyboard
- **THEN** each card's expand/collapse control SHALL be focusable, operable without a pointer, and expose its expanded/collapsed state to assistive technology.

### Requirement: Provider cards SHALL show a price-and-speed teaser

Each collapsed provider card SHALL display a teaser summarizing that provider's offering without naming an individual plan: a starting price and a top speed. The starting price SHALL be `From $X/mo`, where X is the **lowest `priceAutopay`** among the provider's active plans. The top speed SHALL be rendered as `up to Y`, where Y is the value and unit of the provider's **fastest** active plan (the plan with the greatest normalized speed). The teaser SHALL also render the provider identity (the provider's card logo when present, otherwise the provider name in its `primaryColor` as a fallback). All teaser copy SHALL be in English (US market).

#### Scenario: Teaser shows cheapest autopay price and fastest speed
- **WHEN** a collapsed provider card renders for a provider with active plans
- **THEN** it SHALL show `From $X/mo` using the lowest autopay price among that provider's plans
- **AND** it SHALL show `up to Y` using the value and unit of that provider's fastest plan
- **AND** it SHALL NOT name any specific plan in the teaser.

#### Scenario: Teaser shows provider identity
- **WHEN** a collapsed provider card renders
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
