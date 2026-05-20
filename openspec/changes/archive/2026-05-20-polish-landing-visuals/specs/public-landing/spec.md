## ADDED Requirements

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
The Providers section SHALL display provider cards as a carousel-like presentation with three visible cards on desktop, automatic infinite advancement, and manual previous/next controls.

#### Scenario: Providers carousel auto-advances and can be controlled
- **WHEN** active providers are available
- **THEN** the Providers section displays three provider cards at a time on desktop
- **AND** the visible set advances automatically in an infinite loop
- **AND** the visitor can move backward or forward with accessible manual controls
- **AND** the section uses a soft gradient background
