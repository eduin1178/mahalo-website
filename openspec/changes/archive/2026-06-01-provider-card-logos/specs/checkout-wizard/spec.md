## ADDED Requirements

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

The Phase 1 plan cards and add-ons selector, and each Phase 2 (Details) section (contact, installation address, billing, payment), SHALL be presented on the same elevated "premium" card surface used by the landing plan highlights (rounded, soft-shadowed, with a light decorative accent), so the checkout reads as one cohesive, premium experience. Containers that are not themselves selectable (the add-ons selector and the Phase 2 form sections) SHALL NOT apply the hover-lift reserved for selectable plan cards. An address block embedded inside another section (billing inside the billing section) SHALL NOT be double-wrapped in its own card.

#### Scenario: Phase 1 surfaces

- **WHEN** Phase 1 renders
- **THEN** the plan cards and the add-ons selector SHALL use the premium card surface, and the add-ons selector SHALL NOT lift on hover.

#### Scenario: Phase 2 surfaces

- **WHEN** Phase 2 renders
- **THEN** the contact, installation address, billing, and payment sections SHALL each be a premium card, and the optional billing address embedded in the billing section SHALL NOT be wrapped in a second card.

### Requirement: The primary advance action SHALL be a prominent button

Each checkout step's primary advance action ("Continue") SHALL be rendered as a large primary button (full-width on mobile) so it is clearly the main action of the step.

#### Scenario: Continue button prominence

- **WHEN** a checkout step that has a "Continue" action renders
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

### Requirement: The payment-method selector SHALL be a clearly selectable segmented control

When autopay is enabled, the Card / Bank (ACH) selector SHALL render as a segmented control whose track is visually defined and whose active option is clearly emphasized (distinct background, heavier text weight, and elevation), so it is obvious both that the options are switchable and which one is currently selected.

#### Scenario: Autopay enabled shows an emphasized active method

- **WHEN** autopay is enabled
- **THEN** the Card and Bank (ACH) options SHALL appear as a segmented control on a defined track
- **AND** the currently selected option SHALL be visually emphasized relative to the unselected option.
