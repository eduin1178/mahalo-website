# public-landing

## Purpose

Public-facing landing page (`/`) that markets Mahalo's internet-comparator service to anonymous US visitors and funnels them into the ZIP-based search flow. Covers visual hierarchy, content sections, trust signals, price anchoring, and mobile conversion patterns.

## Requirements

### Requirement: Landing page is internet-only and in English

The public landing page at `/` SHALL present only internet-service content. It SHALL NOT mention or link to mobile, voice, or streaming-TV products even though Mahalo sells them through other surfaces. All visible copy on the landing SHALL be in US English.

#### Scenario: Anonymous visitor lands on /
- **WHEN** an anonymous visitor loads `/`
- **THEN** every heading, body paragraph, button label, eyebrow, badge, disclaimer, and CTA on the page is in US English
- **AND** no section references mobile plans, voice plans, or streaming-TV plans
- **AND** the page is server-rendered and revalidates at least every 60 seconds

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

### Requirement: Stat strip provides immediate social proof

A Stat Strip section SHALL appear directly below the hero with three to four headline numbers that signal scale and trust (e.g., providers count, average rating with review count, households served, average match time).

#### Scenario: Stat strip is rendered below hero
- **WHEN** a visitor scrolls past the hero
- **THEN** the next visible section is the Stat Strip
- **AND** it displays at least three numeric stats with short labels
- **AND** placeholder values are clearly realistic (no "Lorem", no zeros, no obvious filler) but the page MAY use hardcoded values until real data is wired
- **AND** each stat is announced to assistive tech as a labelled number

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

### Requirement: Section order leads with value, then reasons

The landing page sections SHALL appear in this exact order on `/`: Hero, Stat Strip, Plan Highlights, How It Works, Providers, Why Mahalo, Testimonials, FAQ, Final CTA.

#### Scenario: Sections render in the prescribed order
- **WHEN** a visitor loads `/`
- **THEN** the DOM order of top-level sections under the page root is: Hero, Stat Strip, Plan Highlights, How It Works, Providers, Why Mahalo, Testimonials, FAQ, Final CTA
- **AND** no other landing section is rendered between them

### Requirement: Existing sections receive visual refresh without behavior change

The Why Mahalo, How It Works, Providers, Testimonials, and FAQ sections SHALL keep their current content semantics and data sources but adopt the refreshed visual treatment (cyan icon glow, provider carousel motion, testimonial avatars with star ratings, and clearer hierarchy).

#### Scenario: Providers carousel still reads from the provider data source
- **WHEN** the Providers section renders
- **THEN** it lists only active providers from `listProviders()`
- **AND** if no active providers exist, it shows the existing empty state message
- **AND** the provider cards display as a carousel-like presentation rather than a static grid

#### Scenario: Providers carousel auto-advances and can be controlled
- **WHEN** active providers are available
- **THEN** the Providers section displays three provider cards at a time on desktop
- **AND** the visible set advances automatically in an infinite loop
- **AND** the visitor can move backward or forward with accessible manual controls
- **AND** the section uses a soft gradient background

#### Scenario: Testimonials show avatar and rating
- **WHEN** the Testimonials section renders
- **THEN** each testimonial displays an avatar (image or initial), a star rating, the quote, and the author name

#### Scenario: Testimonials gradient contrasts with Final CTA
- **WHEN** a visitor compares the Testimonials section and the Final CTA section
- **THEN** Testimonials uses a distinct gradient direction or tonal flow that reads as the opposite/complement of the Final CTA
- **AND** the section does not simply reuse the same `bg-mahalo-cta` treatment unchanged
- **AND** each quote, author, location, avatar or initial, and rating remains readable with WCAG AA contrast

#### Scenario: How It Works emphasizes the human step
- **WHEN** the How It Works section renders
- **THEN** the third step ("A real person calls you - no chatbots") is visually emphasized over the other two to signal the human-agent differentiator

#### Scenario: How It Works changes local vertical image on step hover
- **WHEN** a visitor hovers or focuses a How It Works step
- **THEN** the visual preview changes to the local image associated with that step from `public/landing/steps`
- **AND** each image is vertically framed and related to the step content
- **AND** the preview container is taller and proportionate to the 3:4 image format
- **AND** the textual steps remain sufficient if images fail to load

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

### Requirement: Site header uses a solid logo-compatible surface

The site header SHALL render with a solid light surface compatible with the unmodified logo asset. The logo SHALL NOT require rounded corners, padding, border, or a special surface variant to look correct while scrolling.

#### Scenario: Header is solid over the hero and while scrolling
- **WHEN** the visitor loads `/` or scrolls through the landing page
- **THEN** the site header background is a solid light surface that matches the logo asset background
- **AND** header text and links use dark colors that meet WCAG AA contrast
- **AND** navbar links remain legible without relying on transparent-over-hero styling

#### Scenario: Logo remains unmodified in navbar
- **WHEN** the public navbar renders
- **THEN** the Mahalo logo uses the default logo rendering without rounded-corner, border, padding, or surface treatment
- **AND** the header link still has the accessible label for returning home


### Requirement: Landing animations use CSS and Tailwind only

The landing visual polish SHALL use CSS, Tailwind utilities, and the existing `tw-animate-css` setup for animation. It SHALL NOT add Remotion, Framer Motion, GSAP, Lottie, or any new runtime animation package for the landing UI.

#### Scenario: Motion is implemented without new animation dependencies
- **WHEN** the visual polish is implemented
- **THEN** `package.json` dependencies and devDependencies do not gain a new animation library for this change
- **AND** animated effects are expressed through CSS, Tailwind classes, existing utilities, or `tw-animate-css`

#### Scenario: Motion is accessible
- **WHEN** a visitor has `prefers-reduced-motion: reduce` enabled
- **THEN** non-essential entrance, lift, slide, or decorative motion is disabled or reduced
- **AND** all content remains visible and usable without relying on animation

### Requirement: Plan Highlights uses premium image-backed presentation
The Plan Highlights section SHALL use a professional background image or generated visual with an overlay treatment that supports the existing plan-card content. The section SHALL preserve the existing three-card plan structure, indicative-pricing disclaimer, and CTA behavior.

#### Scenario: Plan section background supports legibility
- **WHEN** a visitor reaches the Plan Highlights section
- **THEN** the section displays a professional background image or generated visual related to home internet, connectivity, or household plan comparison
- **AND** an overlay or gradient treatment ensures headings, body copy, cards, and disclaimers meet WCAG AA contrast
- **AND** the image does not obscure or compete with plan speeds, prices, provider names, or CTAs

#### Scenario: Plan cards feel premium and remain functional
- **WHEN** the three plan cards render
- **THEN** each card keeps speed, monthly price, provider name or logo, provider color accent, and the availability CTA
- **AND** each card uses a polished surface treatment such as layered shadow, glass/blur, gradient border, or equivalent premium styling
- **AND** each card remains readable on mobile and desktop
- **AND** each card CTA still scrolls to or focuses the hero ZIP search while respecting reduced-motion preferences

### Requirement: How It Works includes contextual visual support
The How It Works section SHALL include a contextual visual treatment that reinforces the three-step journey from address lookup to plan selection to real human follow-up.

#### Scenario: Steps visual matches the journey
- **WHEN** a visitor views the How It Works section
- **THEN** the section includes an image, generated visual, or composed visual element related to the steps being described
- **AND** the visual reinforces address lookup, plan comparison, or human-agent follow-up rather than generic decoration
- **AND** the third human-agent step remains visually emphasized

#### Scenario: Steps section remains understandable without the image
- **WHEN** the contextual visual fails to load or is ignored by assistive technology
- **THEN** the three textual steps still communicate the full process
- **AND** the visual does not replace required step text

### Requirement: Testimonials use an inverse-gradient premium trust treatment
The Testimonials section SHALL use a gradient treatment visually distinct from and directionally opposite to the Final CTA gradient while preserving quote readability and trust-focused presentation.

#### Scenario: Testimonials gradient contrasts with Final CTA
- **WHEN** a visitor compares the Testimonials section and the Final CTA section
- **THEN** Testimonials uses a distinct gradient direction or tonal flow that reads as the opposite/complement of the Final CTA
- **AND** the section does not simply reuse the same `bg-mahalo-cta` treatment unchanged

#### Scenario: Testimonial cards remain trust-focused and readable
- **WHEN** testimonial cards render over the gradient background
- **THEN** each quote, author, location, avatar or initial, and rating remains readable with WCAG AA contrast
- **AND** the card treatment feels premium but does not distract from the testimonial content

### Requirement: Public navbar uses solid logo-compatible surface
The public site navbar SHALL use a solid light surface compatible with the unmodified logo asset. The logo SHALL NOT require rounded corners, padding, border, or a special surface variant to look correct while scrolling.

#### Scenario: Logo remains unmodified in navbar
- **WHEN** the public navbar renders
- **THEN** the Mahalo logo uses the default logo rendering without rounded-corner or border treatment
- **AND** the navbar background is a solid light surface that matches the logo asset background
- **AND** navbar links remain legible without relying on transparent-over-hero styling

### Requirement: Plan cards avoid provider top borders
The Plan Highlights cards SHALL NOT use a provider-colored top border or top stripe. Provider color MAY appear only as a subtle contextual accent that does not dominate the card surface.

#### Scenario: Plan card has no top color stripe
- **WHEN** Plan Highlights cards render
- **THEN** no plan card displays a provider-colored top border or top stripe
- **AND** the card hover/focus animation is slightly stronger than the baseline while still respecting reduced-motion preferences

### Requirement: How It Works changes local vertical image on step hover
The How It Works section SHALL display one local 3:4 vertical image per step from `public/landing/steps`, and the preview image SHALL change when the visitor hovers or focuses a step.

#### Scenario: Step hover updates preview image
- **WHEN** a visitor hovers or focuses a How It Works step
- **THEN** the visual preview changes to the image associated with that step
- **AND** each image is local, vertically framed, and related to the step content
- **AND** the preview container is taller and proportionate to the 3:4 image format
- **AND** the textual steps remain sufficient if images fail to load

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
