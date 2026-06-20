## Why

The website review (`openspec/website-check-result.md`, item 2) flags that search must be **ZIP-only**: collecting a full street address to return a price is what legally triggers the FCC Broadband Consumer Labels ("nutrition labels") obligation. Keeping search at the ZIP/area level preserves indicative "starting at" pricing without that compliance burden. At the same time, the Plan step currently dumps every covered provider's plan grid on screen at once; results should surface **providers first** (one provider per full-width card) and reveal plans on demand, matching the reviewer's reference design. Finally, the per-provider teaser ("From $X/mo · up to Y") requires reliably computing the cheapest price and the fastest speed — impossible today because `speed` is free-text, so the field must be split into structured, comparable columns.

## What Changes

- **ZIP-only search.** The hero, Final CTA, and mobile sticky search inputs accept a 5-digit ZIP code **only**. The "address" branch of input classification, plus address-oriented placeholder/aria-label copy, is removed. The installation address is still collected later in the Details step — unchanged. **BREAKING** (user-facing search contract): full-address entry at search is no longer supported.
- **Provider-accordion results.** The Plan step groups results by provider:
  - **Exactly one** covered provider → its plans render directly (no collapse, no extra interaction).
  - **Two or more** providers → one collapsed full-width card per provider showing logo (or `primaryColor` name fallback) and a teaser; clicking expands an accordion revealing that provider's plans with their "Choose plan" actions. This does **not** add a wizard step — it remains the Plan step.
  - Teaser per provider: **price** = `From $X/mo` where X is the cheapest plan's `priceAutopay`; **speed** = `up to Y` where Y is the fastest plan's value + unit.
- **Structured speed field.** **BREAKING** (schema): the `plans.speed` varchar is replaced by `speedValue` (numeric), `speedUnit` (enum `Mbps` | `Gbps`), and `speedMbps` (integer, normalized, derived for comparison/sort). A deterministic data migration parses existing values (`^(\d+)\s+(Mbps|Gbps|Gig)$`), canonicalizes `Gig → Gbps`, and computes `speedMbps` (value, or value×1000 for Gbps). Unparseable rows get `speedValue = NULL` and are logged for manual correction. The old `speed` column is dropped.
- **Speed read/write call sites updated.** A `formatSpeed(value, unit)` helper renders speed consistently across the 6 read sites; the admin plan create/edit form and its Zod schema switch from a free-text `speed` string to numeric value + unit select.

## Capabilities

### New Capabilities
<!-- None — this change modifies existing behavior only. -->

### Modified Capabilities
- `public-landing`: the hero, Final CTA, and mobile sticky search requirements change from "ZIP or address" to **ZIP-only** input and submission.
- `checkout-wizard`: the Plan step changes from a flat, always-expanded provider→plan grid to a **provider-accordion** layout (single-provider direct, multi-provider collapsed cards with a price/speed teaser); plan speed is rendered from structured value+unit instead of a free-text string.

## Impact

- **Search UI:** `components/landing/hero-search.tsx`, `components/landing/mobile-sticky-search.tsx` (remove address branch); `/checkout` entry param handling for `address` (`app/(public)/checkout/page.tsx`, `lib/orders/draft-actions.ts` create-draft input).
- **Results UI:** `components/checkout/phase1-form.tsx` (accordion + single-vs-multi logic + teaser); reads grouped data from `lib/coverage/availability.ts` (already provider-grouped — no backend change to grouping).
- **Schema & data:** `lib/db/schema.ts` (`plans` table columns + new enum), a Drizzle migration, and a one-time data backfill migration. User will back up data before apply.
- **Speed call sites (6):** `components/checkout/phase1-form.tsx`, `components/checkout/review-order-card.tsx`, `components/checkout/order-total-panel.tsx`, `lib/resend/templates/new-order.ts`, `app/admin/(panel)/orders/[id]/page.tsx`, `components/admin/plans/plans-section.tsx`; plus admin write path `lib/plans/actions.ts` (Zod `planCreateSchema`/`planUpdateSchema`) and a new `formatSpeed` helper.
- **No change** to: the four-phase wizard structure, installation-address collection in Details, autopay/payment-by-phone behavior, or the provider→plan grouping query itself.
