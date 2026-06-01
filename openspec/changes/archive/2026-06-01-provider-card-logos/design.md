## Context

Providers today carry a single image field `logo_url` (`lib/db/schema.ts`). Despite the name, the value is a full-bleed promotional graphic authored for the landing marquee (`components/landing/providers-carousel.tsx`, `object-cover`). The checkout plan cards (`components/checkout/phase1-form.tsx`, `PlanOption`) reuse that same image with `object-contain`, plus a plain-text name fallback in fixed navy when the image is missing. Images live in Cloudflare R2, written through `lib/storage/` and uploaded via `uploadProviderLogo` in `lib/providers/actions.ts`, currently keyed as `providers/{id}.{ext}`. The `primaryColor` brand-color field already exists on the table.

The product needs the plan card to show a clean, contained brand logo distinct from the landing artwork, with a strong colored-name fallback when no logo exists.

## Goals / Non-Goals

**Goals:**

- Two independent provider image fields: `landingImageUrl` (landing) and `logoUrl` (plan card, optional).
- Per-provider R2 folder keys so the two assets never collide and are managed independently.
- A plan-card identity contract: logo-only when present; otherwise the provider name as a larger, `primaryColor` fallback over a tinted background.
- Admin can upload/replace/clear each image type separately.
- Zero visual regression on the landing carousel.

**Non-Goals:**

- The checkout closing/confirmation card redesign + confetti (separate change).
- Migrating already-stored R2 objects to the new folder key scheme (old absolute URLs keep working; see Risks).
- Any change to the `primaryColor` field, the storage module API, or environment variables.

## Decisions

### Decision: Rename `logo_url` → `landing_image_url`, add a new nullable `logo_url`

Rather than adding a second field with a new name and leaving `logo_url` semantically wrong, we make `logo_url` mean an actual logo. The rename carries existing promo data into `landing_image_url` (landing keeps working with no data backfill), and the new `logo_url` starts null everywhere, so every provider cleanly enters the colored-name fallback until an admin uploads a real logo.

- **Alternative considered — add `card_logo_url`, keep `logo_url` for the landing:** zero migration, but leaves `logoUrl` permanently misnamed (it holds a promo image, not a logo). Rejected for long-term clarity; the team chose the rename.

Migration (Drizzle):

```sql
ALTER TABLE providers RENAME COLUMN logo_url TO landing_image_url;
ALTER TABLE providers ADD COLUMN logo_url text;
```

### Decision: Per-provider R2 folder keys

New uploads use `providers/{id}/landing.{ext}` and `providers/{id}/logo.{ext}`. A folder per provider keeps the two assets isolated and makes per-type replace/cleanup unambiguous. The storage module API (`putObject`/`getPublicUrl`/`deleteObject`) is unchanged — only the keys callers pass change.

### Decision: One parameterized upload action over two near-duplicate actions

Generalize the upload to an image-type parameter (`type: "landing" | "logo"`) that selects the DB column and the key suffix, rather than copy-pasting `uploadProviderLogo` into `uploadProviderLanding`. Keeps validation (size/MIME), R2 streaming, and old-object cleanup in one place. The existing `uploadProviderLogo` export can be preserved as a thin wrapper if any caller still references it.

### Decision: Admin UI reuses one image-upload component, instantiated twice

`provider-logo-form.tsx` is parameterized by image type (label, current value, action target) and rendered twice on the provider detail page — one slot for the landing image, one for the card logo. Avoids divergent upload UIs.

### Decision: Fallback renders the name in `primaryColor` over a ~10% tint

When `logoUrl` is absent, the identity slot renders the provider name larger than normal card labels, colored with `primaryColor`, on a background of the same color at ~10% opacity. The tint guarantees a color relationship between text and background so the name stays legible across brand colors. Existing `provider-logo-image.tsx` (plain `<img>`) is reused unchanged for the logo image.

### Decision: Premium UI polish, including two shared primitives, shipped with this change

Beyond the logo split, this change absorbed a round of checkout UI polish requested during implementation: the plan cards and all Phase 1/Phase 2 form sections adopt the landing's premium card surface; the "Continue" CTA is enlarged; and the plan CTA matches the landing button. Two of these touch **global** primitives and therefore affect the whole app (admin included), which was accepted as a net improvement:

- `components/ui/input.tsx` — taller fields (`h-10`) and a brand-tinted border (`border-mahalo-navy-900/20`, hover `/30`) replacing the low-contrast slate-200 `border-input`.
- `components/ui/tabs.tsx` — the default variant now reads as a segmented control: a defined track (`border` + `bg-surface`, `h-10`) and an emphasized active tab (navy semibold text, subtle border, shadow).

Plan-card and form-section surfaces sit on the checkout's white background, so they are defined primarily by their shadow ("floating" look) rather than the white-on-white border — a deliberate, accepted trade-off (see below).

## Risks / Trade-offs

- **Code/migration skew** → If code reading `landingImageUrl` deploys before the migration runs, provider queries break. Mitigation: run the Drizzle migration as part of the deploy step, before/with the new code; on Vercel this is a single ordered pipeline.
- **Orphaned old R2 objects** → Existing landing images keep their old absolute URLs (`providers/{id}.{ext}`) and render fine, but the first landing-image *replacement* writes to the new folder key and the best-effort cleanup won't match the legacy key, leaving the old object orphaned. Mitigation: accept it (non-fatal, small storage cost); optionally a one-time cleanup script later.
- **Light brand-color legibility** → A very light `primaryColor` over a 10% tint of itself can be low-contrast. Mitigation: the tint provides a baseline relationship; brand colors are typically saturated. If real contrast failures appear, add a luminance check in a follow-up — out of scope here.
- **Missed `logoUrl` readers** → Any query/DTO still selecting only the old field could silently drop one of the two images from checkout. Mitigation: audit all `logoUrl` references and ensure provider DTOs feeding checkout select both fields.

## Migration Plan

1. Apply schema change in `lib/db/schema.ts`; generate the Drizzle migration (rename + add column).
2. Update the upload action and admin UI to write/manage both image types under the folder keys.
3. Update consumers: landing carousel → `landingImageUrl`; plan card → `logoUrl` + colored-name fallback; provider DTOs/queries → select both fields.
4. Deploy with the migration ordered before the new code goes live.
5. Rollback: the new `logo_url` column is nullable and unused by the landing; reverting code is safe. To fully revert the schema, rename `landing_image_url` back to `logo_url` and drop the new column (no data loss for landing images).

## Open Questions

- None blocking. (Optional future: automated contrast handling for the colored-name fallback; one-time R2 cleanup of legacy single-file keys.)
