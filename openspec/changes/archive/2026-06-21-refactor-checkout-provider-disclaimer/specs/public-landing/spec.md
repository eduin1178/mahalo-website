## MODIFIED Requirements

### Requirement: Plan Highlights anchor price and speed expectations

A Plan Highlights section SHALL display three premium plan cards that anchor the visitor's price and speed expectations before they enter the providers carousel. Each card's monthly price SHALL be preceded by the label "Starting at" to signal that the figure is an entry price.

#### Scenario: Plan Highlights show three tiered cards
- **WHEN** a visitor reaches the Plan Highlights section
- **THEN** exactly three plan cards are rendered side by side on desktop and stacked on mobile
- **AND** each card shows a download speed in Mbps or Gbps, a monthly price preceded by "Starting at", and the provider name or logo
- **AND** no card displays a provider-colored top border or top stripe
- **AND** provider color appears only as a subtle contextual accent that does not dominate the card surface
- **AND** a disclaimer "Indicative pricing — varies by address" is visible in or near the section
- **AND** each card has a clear CTA that scrolls to or focuses the hero ZIP search while respecting reduced-motion preferences

#### Scenario: Price is labeled as a starting price
- **WHEN** a Plan Highlights card renders its monthly price
- **THEN** the text "Starting at" SHALL appear immediately before the price value.

### Requirement: Providers display as a controlled carousel

The Providers section SHALL display provider cards as a carousel-like presentation with three visible cards on desktop, automatic infinite advancement, and manual previous/next controls. Each provider card SHALL render the provider's logo (`logoUrl`) as its identity, not the landing image (`landingImageUrl`); the card design SHALL suit a contained logo on a light surface rather than a full-bleed background image. When a provider has no `logoUrl`, the card SHALL fall back to the provider name on a brand-colored surface.

#### Scenario: Providers carousel auto-advances and can be controlled
- **WHEN** active providers are available
- **THEN** the Providers section displays three provider cards at a time on desktop
- **AND** the visible set advances automatically in an infinite loop
- **AND** the visitor can move backward or forward with accessible manual controls
- **AND** the section uses a soft gradient background

#### Scenario: Provider card renders the logo
- **WHEN** a provider card renders for a provider whose `logoUrl` is set
- **THEN** the card SHALL display the logo contained (not cropped) on a light surface
- **AND** SHALL NOT use the `landingImageUrl` as the card background.

#### Scenario: Provider card without a logo
- **WHEN** a provider card renders for a provider whose `logoUrl` is null or empty
- **THEN** the card SHALL display the provider `name` on a brand-colored surface as the fallback identity.
