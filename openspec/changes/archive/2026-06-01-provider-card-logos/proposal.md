## Why

The checkout plan cards and the landing carousel currently share a single provider image field (`logoUrl`). That image is a full-bleed promotional graphic tuned for the landing marquee, so it reads poorly as the brand mark inside a plan card. Buyers can't quickly identify which carrier they're choosing, which erodes trust at the highest-intent moment of the funnel. Splitting the two images lets the landing keep its promotional artwork while the plan cards show a clean, contained logo (or a strong colored name fallback when no logo is uploaded).

## What Changes

- **BREAKING (data model):** Rename the provider column `logo_url` → `landing_image_url`. Existing values travel with the rename and continue to feed the landing carousel.
- Add a new **nullable** `logo_url` column = the dedicated, contained provider logo used **only** in the checkout plan cards. The card logo is optional.
- R2 key scheme moves from a single `providers/{id}.{ext}` object to a per-provider folder: `providers/{id}/landing.{ext}` and `providers/{id}/logo.{ext}`. Each image type is uploaded, replaced, and cleaned up independently.
- Plan card display contract: when the card logo image exists, render **only** the logo (no provider name text). When it is absent, render the provider **name** as the protagonist — larger text in the provider's `primaryColor`, over a subtle `primaryColor`-tinted background to guarantee legibility.
- Admin provider UI gains a **second upload**: landing image and card logo are managed as two separate fields, each with its own preview, replace, and clear.
- The landing carousel switches its image source from `logoUrl` to `landingImageUrl` (no visual change for end users).
- Plan selection cards cap their grid at **two columns** (instead of three) so cards stay wide and readable on large screens.
- Plan cards gain a **hover elevation** effect (lift + stronger shadow) to signal interactivity, while preserving the existing selected state.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `file-storage`: provider image upload changes from a single logo object to two distinct image types (landing image, card logo) under a per-provider folder key scheme, each uploaded/replaced/deleted independently.
- `checkout-wizard`: Phase 1 plan cards gain a defined provider-identity display contract — dedicated card logo when present, otherwise the provider name as a larger, brand-colored fallback.

## Impact

- **Database:** `lib/db/schema.ts` — rename `logo_url` → `landing_image_url`, add nullable `logo_url`. New Drizzle migration: `ALTER TABLE providers RENAME COLUMN logo_url TO landing_image_url; ALTER TABLE providers ADD COLUMN logo_url text;`.
- **Storage / actions:** `lib/providers/actions.ts` — `uploadProviderLogo` (and/or a new sibling action) handles two image types, two R2 keys under `providers/{id}/`, and per-type old-object cleanup. Reuses the existing `lib/storage/` module API (`putObject`/`getPublicUrl`/`deleteObject`).
- **Admin UI:** `components/admin/providers/provider-logo-form.tsx` extended (or split) to manage two uploads; `app/admin/(panel)/providers/[id]/page.tsx` shows both sections.
- **Checkout:** `components/checkout/phase1-form.tsx` (`PlanOption`) consumes the new `logoUrl` for the card logo and implements the colored-name fallback. Provider DTOs/queries feeding checkout must select **both** image fields. The plan grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) drops the `lg:grid-cols-3` cap so cards stay two-wide; the card adds a hover-elevation transition.
- **Landing:** `components/landing/providers-carousel.tsx` switches to `landingImageUrl`.
- **Reuse:** `components/providers/provider-logo-image.tsx` (plain `<img>` for dynamic R2 URLs) is reused as-is.
- **No change:** `primaryColor` already exists on the providers table; no schema work needed for the fallback color. Environment variables and the storage module API are unchanged.
- **Out of scope:** the checkout closing/confirmation card redesign + confetti (tracked as a separate change).
