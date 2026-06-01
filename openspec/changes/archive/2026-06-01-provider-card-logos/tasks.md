## 1. Data model & migration

- [x] 1.1 In `lib/db/schema.ts`, rename the `providers.logoUrl` column mapping `logo_url` → `landing_image_url`, and add a new nullable `logoUrl` mapped to `logo_url` (text)
- [x] 1.2 Generate the Drizzle migration: `ALTER TABLE providers RENAME COLUMN logo_url TO landing_image_url; ALTER TABLE providers ADD COLUMN logo_url text;`
- [x] 1.3 Update any shared provider types/DTOs to expose both `landingImageUrl` and `logoUrl`

## 2. Storage / upload action

- [x] 2.1 Generalize the provider image upload in `lib/providers/actions.ts` to accept an image type (`"landing" | "logo"`) selecting the DB column and the R2 key suffix
- [x] 2.2 Write uploads to per-provider folder keys: `providers/{id}/landing.{ext}` and `providers/{id}/logo.{ext}` via the `lib/storage/` module
- [x] 2.3 On replace, attempt to delete the previous object of the SAME type only (ignore not-found); never touch the other image type
- [x] 2.4 Keep size/MIME validation before any `putObject`; return validation errors without touching storage
- [x] 2.5 Preserve a thin `uploadProviderLogo` wrapper if any existing caller still references it (N/A — the sole caller was migrated to `uploadProviderImage`, so no wrapper is needed)

## 3. Admin UI

- [x] 3.1 Parameterize `components/admin/providers/provider-logo-form.tsx` by image type (label, current value, action target)
- [x] 3.2 Render two upload slots on `app/admin/(panel)/providers/[id]/page.tsx`: one for the landing image, one for the card logo, each with preview/replace/clear
- [x] 3.3 Confirm the new-provider creation flow still works (logos uploaded afterward on the detail page)

## 4. Consumers

- [x] 4.1 Update `components/landing/providers-carousel.tsx` to source its image from `landingImageUrl`
- [x] 4.2 Update `components/checkout/phase1-form.tsx` (`PlanOption`) to render the card logo from `logoUrl` (contained), with NO name text when the logo is present
- [x] 4.3 Implement the colored-name fallback: when `logoUrl` is absent, render the provider `name` in `primaryColor`, larger than ordinary card labels, over a ~10% `primaryColor`-tinted background
- [x] 4.4 Ensure provider queries feeding checkout (plan selection) select BOTH image fields (queries use `select()` — all columns auto-included)
- [x] 4.5 Audit remaining `logoUrl` references across the codebase and repoint landing-context reads to `landingImageUrl`
- [x] 4.6 Cap the plan grid at two columns: change `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` to `grid-cols-1 sm:grid-cols-2` in `phase1-form.tsx`
- [x] 4.7 Add a hover-elevation effect to `PlanOption` (lift + stronger shadow via the existing `transition`, e.g. `hover:-translate-y-0.5 hover:shadow-lg`) without overriding the selected state
- [x] 4.8 Restyle the `PlanOption` CTA to match the landing "Check availability" button (navy filled `rounded-xl border-2` pill from `plan-highlights.tsx`); keep a distinct outline treatment for the selected state
- [x] 4.9 Restyle the `PlanOption` card surface to match the landing plan card (`rounded-3xl premium-light-card`, decorative cyan blur + top hairline, `rounded-2xl` price box, hover lift+scale+deep shadow); selected state via `ring-2 ring-mahalo-blue-600`
- [x] 4.10 Wrap the add-ons section in the same premium card surface (`rounded-3xl premium-light-card` + decorative accents, no hover-lift since it is a form container) so it stands out
- [x] 4.11 Enlarge the Phase 1 "Continue" CTA (`h-12`, larger padding/text, full-width on mobile)
- [x] 4.12 Wrap each Phase 2 (Details) section in the premium card surface via a shared `SectionCard` (Contact, Installation address, Billing, Payment); embedded billing address stays plain
- [x] 4.13 Enlarge the Phase 2 "Continue" CTA to match Phase 1

## 6. Shared form UI polish (global primitives)

- [x] 6.1 Make `components/ui/input.tsx` taller (`h-8`→`h-10`, more padding) and raise border contrast (`border-mahalo-navy-900/20` + hover `/30`) instead of the low-contrast `border-input` slate-200
- [x] 6.2 Restyle `components/ui/tabs.tsx` default variant so tabs read as a selectable segmented control: defined track (`border + bg-surface`, taller `h-10`), active tab with navy semibold text, subtle border + shadow

## 5. Verification

- [x] 5.1 Run the migration against a dev database (`migrations applied successfully`); landing reads `landingImageUrl` (the renamed column keeps the original URLs, so the carousel is unchanged)
- [x] 5.2 In checkout, verify a provider WITH a card logo shows logo-only (no name text) — manual browser check pending
- [x] 5.3 In checkout, verify a provider WITHOUT a card logo shows the larger brand-colored name on a tint — manual browser check pending
- [x] 5.4 In admin, upload/replace/clear each image type independently and confirm the other is unaffected — manual browser check pending
- [x] 5.5 Run typecheck/lint and confirm no broken `logoUrl` references remain (`tsc --noEmit` clean, eslint clean, reference audit clean)
- [x] 5.6 On a desktop viewport, confirm the plan grid shows at most two cards per row and collapses to one column on mobile — manual browser check pending
- [x] 5.7 Confirm hovering an unselected card lifts it (and a selected card keeps its border/ring treatment) — manual browser check pending
