## ADDED Requirements

### Requirement: Landing page is internet-only and in English

The public landing page at `/` SHALL present only internet-service content. It SHALL NOT mention or link to mobile, voice, or streaming-TV products even though Mahalo sells them through other surfaces. All visible copy on the landing SHALL be in US English.

#### Scenario: Anonymous visitor lands on /
- **WHEN** an anonymous visitor loads `/`
- **THEN** every heading, body paragraph, button label, eyebrow, badge, disclaimer, and CTA on the page is in US English
- **AND** no section references mobile plans, voice plans, or streaming-TV plans
- **AND** the page is server-rendered and revalidates at least every 60 seconds

### Requirement: Hero is impactful and address-search-first

The hero section SHALL be visually dominant on first paint, use a dark navy background with moderate cyan-accented decoration, and present the ZIP/address search as the primary action above the fold on both mobile and desktop.

#### Scenario: Desktop hero above the fold
- **WHEN** a desktop visitor (viewport width ≥ 1024px) loads `/`
- **THEN** the hero fills the viewport area down to at least 600px height
- **AND** the hero background is the dark navy brand color (`--mahalo-navy-900`) with a moderate cyan glow decoration
- **AND** the H1 headline, the ZIP/address search input, and the primary "Search" CTA are visible without scrolling
- **AND** a sub-CTA strip with three short benefit lines is visible below the search
- **AND** a price anchor in the form "Plans starting at $X.99/mo" is visible in the hero
- **AND** a strip of provider logos is visible at the bottom of the hero

#### Scenario: Mobile hero above the fold
- **WHEN** a mobile visitor (viewport width < 768px) loads `/`
- **THEN** the H1 headline and the ZIP/address search input are visible without scrolling
- **AND** the primary "Search" CTA is visible without scrolling or sits directly adjacent to the input
- **AND** text contrast on the dark hero background meets WCAG AA (4.5:1 for body, 3:1 for large text)

#### Scenario: Hero search submits to provider lookup
- **WHEN** a visitor enters a valid ZIP or address into the hero search and submits
- **THEN** the existing address-lookup flow is invoked unchanged
- **AND** invalid input shows the existing validation messages

### Requirement: Stat strip provides immediate social proof

A Stat Strip section SHALL appear directly below the hero with three to four headline numbers that signal scale and trust (e.g., providers count, average rating with review count, households served, average match time).

#### Scenario: Stat strip is rendered below hero
- **WHEN** a visitor scrolls past the hero
- **THEN** the next visible section is the Stat Strip
- **AND** it displays at least three numeric stats with short labels
- **AND** placeholder values are clearly realistic (no "Lorem", no zeros, no obvious filler) but the page MAY use hardcoded values until real data is wired
- **AND** each stat is announced to assistive tech as a labelled number

### Requirement: Plan Highlights anchor price and speed expectations

A Plan Highlights section SHALL display three plan cards that anchor the visitor's price and speed expectations before they enter the providers grid.

#### Scenario: Plan Highlights show three tiered cards
- **WHEN** a visitor reaches the Plan Highlights section
- **THEN** exactly three plan cards are rendered side by side on desktop and stacked on mobile
- **AND** each card shows a download speed in Mbps or Gbps, a monthly price, and the provider name or logo
- **AND** each card has a colored top stripe matching the provider's brand color
- **AND** a disclaimer "Indicative pricing — varies by address" is visible in or near the section
- **AND** each card has a clear CTA that scrolls to or focuses the hero ZIP search

### Requirement: Section order leads with value, then reasons

The landing page sections SHALL appear in this exact order on `/`: Hero, Stat Strip, Plan Highlights, How It Works, Providers Grid, Why Mahalo, Testimonials, FAQ, Final CTA.

#### Scenario: Sections render in the prescribed order
- **WHEN** a visitor loads `/`
- **THEN** the DOM order of top-level sections under the page root is: Hero, Stat Strip, Plan Highlights, How It Works, Providers Grid, Why Mahalo, Testimonials, FAQ, Final CTA
- **AND** no other landing section is rendered between them

### Requirement: Existing sections receive visual refresh without behavior change

The Why Mahalo, How It Works, Providers Grid, Testimonials, and FAQ sections SHALL keep their current content semantics and data sources but adopt the refreshed visual treatment (cyan icon glow, provider hover states without the top color border, testimonial avatars with star ratings, and clearer hierarchy).

#### Scenario: Providers grid still reads from the provider data source
- **WHEN** the Providers Grid renders
- **THEN** it lists only active providers from `listProviders()`
- **AND** if no active providers exist, it shows the existing empty state message
- **AND** the top color border per card is removed in favor of a hover treatment

#### Scenario: Testimonials show avatar and rating
- **WHEN** the Testimonials section renders
- **THEN** each testimonial displays an avatar (image or initial), a star rating, the quote, and the author name

#### Scenario: How It Works emphasizes the human step
- **WHEN** the How It Works section renders
- **THEN** the third step ("we handle the rest") is visually emphasized over the other two (e.g., larger icon, accent color) to signal the human-agent differentiator

### Requirement: Final CTA repeats the address search

A Final CTA section SHALL appear at the bottom of the page with a navy-to-cyan gradient background and a repeated ZIP/address search input.

#### Scenario: Final CTA renders at end of page
- **WHEN** a visitor scrolls to the bottom of `/`
- **THEN** the last section before the site footer is the Final CTA
- **AND** it contains a heading, a brief supporting line, and a ZIP/address search that submits to the same lookup as the hero search
- **AND** its background uses the navy→cyan gradient

### Requirement: Mobile sticky search bar drives conversion

On mobile viewports, a sticky ZIP-search bar SHALL appear at the bottom of the screen once the visitor scrolls past the hero, and SHALL hide when the Final CTA is in view to avoid duplication.

#### Scenario: Sticky bar appears after hero scroll on mobile
- **WHEN** a mobile visitor (viewport width < 768px) scrolls past the bottom of the hero
- **THEN** a sticky bar with a ZIP/address input and a Search button is visible at the bottom of the viewport
- **AND** the sticky bar does not cover the site footer or the Final CTA when either is in view
- **AND** the sticky bar is not present on desktop viewports

#### Scenario: Sticky bar is accessible
- **WHEN** the sticky bar is visible
- **THEN** it does not trap keyboard focus
- **AND** it is announced as a landmark or labelled region to assistive tech
- **AND** dismiss/hide behavior does not rely on hover-only interactions

### Requirement: Site header adapts to dark hero

The site header SHALL render with a transparent background while overlaying the dark hero, and SHALL switch to a solid (light) background once the visitor scrolls past the hero, so it remains legible over any section.

#### Scenario: Header is transparent over the hero
- **WHEN** the visitor is at the top of `/` with the hero fully visible
- **THEN** the site header background is transparent
- **AND** header text and links use light colors that meet WCAG AA contrast against the navy hero

#### Scenario: Header becomes solid after scrolling past hero
- **WHEN** the visitor scrolls so the hero is no longer at the top of the viewport
- **THEN** the site header background becomes the default light surface
- **AND** header text and links revert to their default dark colors

### Requirement: Brand palette is preserved and extended through utilities only

The redesign SHALL use the existing Mahalo palette tokens defined in `app/globals.css` (`--mahalo-navy-900`, `--mahalo-navy-700`, `--mahalo-blue-600`, `--mahalo-cyan-500`, `--mahalo-cyan-300`, and the `--mahalo-gradient`). Cyan accent intensity SHALL be moderate — never the dominant surface color and never reduced below a perceivable accent. New visual effects (glow, glass, dark-hero background) SHALL be added as new utility classes; no existing token values may change.

#### Scenario: No existing palette tokens are mutated
- **WHEN** a developer inspects the `:root` and `@theme inline` blocks of `app/globals.css` after the change
- **THEN** the existing `--mahalo-*`, `--primary`, `--accent`, `--ring`, and gradient token values are unchanged
- **AND** any new visual effects are introduced as additional utility classes under `@layer utilities` or as new tokens that do not overwrite existing ones

#### Scenario: Cyan accent stays moderate
- **WHEN** a designer audits the redesigned hero, stat strip, plan highlights, and final CTA
- **THEN** cyan is used as an accent on icons, glows, ring/focus, and gradient endpoints
- **AND** cyan is not used as the dominant background of any full section

### Requirement: No new runtime dependencies or out-of-scope changes

The redesign SHALL be implemented using the existing Tailwind v4, shadcn/ui, lucide-react, and next/image setup, with no new npm packages, and SHALL NOT modify the checkout flow, admin panel, address validation, provider/plan data model, authentication, Resend emails, n8n webhook, or Docker setup.

#### Scenario: Dependency manifest is unchanged
- **WHEN** the change is implemented
- **THEN** `package.json` `dependencies` and `devDependencies` have no additions or removals attributable to this change

#### Scenario: Out-of-scope surfaces untouched
- **WHEN** the change is implemented
- **THEN** files under `app/(public)/checkout/**`, `app/admin/**`, `lib/providers/**`, `lib/plans/**` (queries), Drizzle schema/migrations, Clerk config, Resend/email code, and Docker config show no changes attributable to this redesign
