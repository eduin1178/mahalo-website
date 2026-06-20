## MODIFIED Requirements

### Requirement: Hero is impactful and address-search-first

The hero section SHALL be visually dominant on first paint, use a dark navy background with moderate cyan-accented decoration, and present the **ZIP-code** search as the primary action above the fold on both mobile and desktop. The search input SHALL accept a 5-digit ZIP code only; full street addresses SHALL NOT be accepted at the search step.

#### Scenario: Desktop hero above the fold
- **WHEN** a desktop visitor (viewport width ≥ 1024px) loads `/`
- **THEN** the hero fills the viewport area down to at least 600px height
- **AND** the hero background is the dark navy brand color (`--mahalo-navy-900`) with a moderate cyan glow decoration
- **AND** the H1 headline, the ZIP-code search input, and the primary "Search" CTA are visible without scrolling
- **AND** a sub-CTA strip with three short benefit lines is visible below the search
- **AND** a price anchor in the form "Plans starting at $X.99/mo" is visible in the hero
- **AND** a strip of provider logos is visible at the bottom of the hero

#### Scenario: Mobile hero above the fold
- **WHEN** a mobile visitor (viewport width < 768px) loads `/`
- **THEN** the H1 headline and the ZIP-code search input are visible without scrolling
- **AND** the primary "Search" CTA is visible without scrolling or sits directly adjacent to the input
- **AND** text contrast on the dark hero background meets WCAG AA (4.5:1 for body, 3:1 for large text)

#### Scenario: Hero search submits a valid ZIP to provider lookup
- **WHEN** a visitor enters a valid 5-digit ZIP code into the hero search and submits
- **THEN** the existing provider-lookup flow is invoked with the ZIP code

#### Scenario: Hero search rejects non-ZIP input
- **WHEN** a visitor submits the hero search with anything other than a 5-digit numeric ZIP (including a full street address)
- **THEN** the search SHALL NOT submit
- **AND** an inline validation message SHALL instruct the visitor to enter a 5-digit ZIP code.

### Requirement: Final CTA repeats the address search

A Final CTA section SHALL appear at the bottom of the page with a navy-to-cyan gradient background and a repeated **ZIP-code** search input that behaves identically to the hero search (5-digit ZIP only).

#### Scenario: Final CTA renders at end of page
- **WHEN** a visitor scrolls to the bottom of `/`
- **THEN** the last section before the site footer is the Final CTA
- **AND** it contains a heading, a brief supporting line, and a ZIP-code search that submits to the same lookup as the hero search
- **AND** its background uses the navy→cyan gradient

#### Scenario: Final CTA search rejects non-ZIP input
- **WHEN** a visitor submits the Final CTA search with anything other than a 5-digit numeric ZIP
- **THEN** the search SHALL NOT submit and SHALL show the same ZIP validation message as the hero search.

### Requirement: Mobile sticky search bar drives conversion

On mobile viewports, a sticky **ZIP-code** search bar SHALL appear at the bottom of the screen once the visitor scrolls past the hero, and SHALL hide when the Final CTA is in view to avoid duplication. Its input SHALL accept a 5-digit ZIP code only.

#### Scenario: Sticky bar appears after hero scroll on mobile
- **WHEN** a mobile visitor (viewport width < 768px) scrolls past the bottom of the hero
- **THEN** a sticky bar with a ZIP-code input and a Search button is visible at the bottom of the viewport
- **AND** the sticky bar does not cover the site footer or the Final CTA when either is in view
- **AND** the sticky bar is not present on desktop viewports

#### Scenario: Sticky bar is accessible
- **WHEN** the sticky bar is visible
- **THEN** it does not trap keyboard focus
- **AND** it is announced as a landmark or labelled region to assistive tech
- **AND** dismiss/hide behavior does not rely on hover-only interactions
