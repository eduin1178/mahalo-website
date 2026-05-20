## 1. Visual assets and additive utilities

- [x] 1.1 Select or create stable image assets for Plan Highlights and How It Works; store them under `public/` with descriptive filenames and no remote runtime dependency.
- [x] 1.2 Add only additive CSS/Tailwind utilities in `app/globals.css` for any needed overlays, inverse testimonial gradient, premium glass/card surfaces, and motion helpers.
- [x] 1.3 Verify existing Mahalo brand tokens and existing gradient token values are not mutated.
- [x] 1.4 Ensure all new motion utilities can be disabled or reduced with `prefers-reduced-motion` patterns.

## 2. Logo surface variant

- [x] 2.1 Extend `components/brand/Logo.tsx` with an explicit `variant="surface"` or equivalent opt-in public surface treatment.
- [x] 2.2 Preserve the existing default and white logo behavior for non-public contexts.
- [x] 2.3 Update `components/landing/site-header.tsx` to use the surface logo treatment without changing header scroll behavior.
- [x] 2.4 Update `components/landing/site-footer.tsx` to use the same surface logo treatment.
- [x] 2.5 Verify the header and footer logo no longer appear as an accidental square white patch over their surrounding surfaces.

## 3. Plan Highlights premium treatment

- [x] 3.1 Update `components/landing/plan-highlights.tsx` so the section uses the selected professional background image with a strong overlay/gradient for readability.
- [x] 3.2 Keep the section ID, heading, supporting copy, three plan cards, provider accents, indicative-pricing disclaimer, and CTA behavior intact.
- [x] 3.3 Upgrade `PlanCard` styling with a premium card surface such as glass/blur, layered shadow, gradient border, or equivalent polished treatment.
- [x] 3.4 Add restrained CSS/Tailwind animation for card entrance and hover states using `tw-animate-css` or existing motion utilities.
- [x] 3.5 Ensure card motion is non-essential and disabled/reduced for users with reduced-motion preferences.
- [x] 3.6 Verify speeds, prices, provider names, and CTAs remain visually dominant over the background image on mobile and desktop.

## 4. How It Works contextual visual

- [x] 4.1 Update `components/landing/how-it-works.tsx` with an editorial layout that includes a contextual image or composed visual related to address lookup, plan comparison, and human follow-up.
- [x] 4.2 Preserve the three textual steps and keep the third human-agent step visually emphasized.
- [x] 4.3 Ensure the section remains understandable if the image is unavailable or ignored by assistive technology.
- [x] 4.4 Add only subtle CSS/Tailwind transitions or entrance effects; no runtime animation dependency.

## 5. Testimonials inverse-gradient treatment

- [x] 5.1 Update `components/landing/testimonials.tsx` with a gradient direction/tone that is visually opposite or complementary to the Final CTA treatment.
- [x] 5.2 Ensure the Testimonials section does not simply reuse `bg-mahalo-cta` unchanged.
- [x] 5.3 Upgrade testimonial cards with a premium trust-card surface while preserving quote, author, location, avatar/initial, and rating content.
- [x] 5.4 Verify all quote and attribution text remains readable with WCAG AA contrast over the new background/card treatment.
- [x] 5.5 Keep animations calm and trust-focused; avoid infinite pulsing or motion that competes with quotes.

## 6. Verification

- [x] 6.1 Run static inspection to confirm no files outside the intended landing/logo/public-asset/CSS scope were modified.
- [x] 6.2 Run lint or typecheck if available and appropriate; do not run a production build because project instructions say never build after changes.
- [x] 6.3 Manually review `/` in local dev at desktop and mobile viewport sizes for logo polish, Plan Highlights readability, How It Works visual fit, Testimonials gradient, and reduced-motion behavior.
- [x] 6.4 Confirm `package.json` dependencies and devDependencies are unchanged.
- [x] 6.5 Confirm the existing address-search, plan-card CTA scroll/focus behavior, header scroll behavior, and mobile sticky search behavior still work.


## 7. Follow-up visual review adjustments

- [x] 7.1 Revert public header/footer logo to default unrounded rendering.
- [x] 7.2 Make the public navbar a solid light surface with no transparent-over-hero styling.
- [x] 7.3 Remove provider-colored top borders/stripes from Plan Highlights cards.
- [x] 7.4 Strengthen Plan Highlights card animation slightly while preserving reduced-motion behavior.
- [x] 7.5 Replace How It Works visual with one photorealistic Unsplash background per step that changes on hover/focus.
- [x] 7.6 Replace Providers Grid with a three-visible auto-advancing provider carousel with manual previous/next controls.
- [x] 7.7 Add soft gradient background treatment to the Providers section.
- [x] 7.8 Replace How It Works remote Unsplash images with local `public/landing/steps` images and adjust the preview container to a taller 3:4 portrait proportion.
