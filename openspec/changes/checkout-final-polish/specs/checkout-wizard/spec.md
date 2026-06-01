## MODIFIED Requirements

### Requirement: Checkout plan cards and form sections SHALL share a cohesive premium card surface

The Phase 1 plan cards and add-ons selector, each Phase 2 (Details) section (contact, installation address, billing, payment), and each Phase 3 (Instalación) section (choose a day, choose a time, consent), SHALL be presented on the same elevated "premium" card surface used by the landing plan highlights (rounded, soft-shadowed, with a light decorative accent), so the checkout reads as one cohesive, premium experience. Containers that are not themselves selectable (the add-ons selector and the Phase 2/Phase 3 form sections) SHALL NOT apply the hover-lift reserved for selectable plan cards. An address block embedded inside another section (billing inside the billing section) SHALL NOT be double-wrapped in its own card.

#### Scenario: Phase 1 surfaces

- **WHEN** Phase 1 renders
- **THEN** the plan cards and the add-ons selector SHALL use the premium card surface, and the add-ons selector SHALL NOT lift on hover.

#### Scenario: Phase 2 surfaces

- **WHEN** Phase 2 renders
- **THEN** the contact, installation address, billing, and payment sections SHALL each be a premium card, and the optional billing address embedded in the billing section SHALL NOT be wrapped in a second card.

#### Scenario: Phase 3 surfaces

- **WHEN** Phase 3 (schedule) renders
- **THEN** the "choose a day", "choose a time", and consent sections SHALL each use the premium card surface and SHALL NOT lift on hover.

### Requirement: The primary advance action SHALL be a prominent button

Each checkout step's primary advance action ("Continue" in Phases 1–2, "Confirm order" in Phase 3) SHALL be rendered as a large primary button (full-width on mobile) so it is clearly the main action of the step.

#### Scenario: Continue button prominence

- **WHEN** a checkout step that has a "Continue" action renders
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

#### Scenario: Confirm order button prominence

- **WHEN** Phase 3 (schedule) renders its "Confirm order" action
- **THEN** the button SHALL be a large primary (gradient) button and SHALL span the full width on narrow viewports.

## ADDED Requirements

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
