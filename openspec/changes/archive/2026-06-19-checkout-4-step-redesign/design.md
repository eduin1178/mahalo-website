## Context

The checkout wizard is URL-routed (one page per step under `app/(public)/checkout/`), with draft state persisted in a signed cookie + `orders` row (`lib/orders/draft.ts`, `lib/orders/draft-actions.ts`). The stepper (`components/checkout/stepper.tsx`) derives the active step from the pathname against a `PHASES` array. The order-total panel is rendered once at the layout level (`order-total-panel-client.tsx`) and shown on every checkout page except `/checkout` and `/checkout/confirmation`.

Today `finalizePhase1` persists plan **and** add-ons together and redirects straight to `/checkout/details`; the add-ons UI lives inline in `phase1-form.tsx`. Installation time is stored as a single UTC timestamp (`scheduledAt = Date.UTC(y, m, d, hour)`) with `hour` validated 8–17, and rendered from `scheduledAt` everywhere downstream (review card, confirmation, order email, n8n webhook, admin order views).

This change inserts a step, moves add-ons out of Plan, changes the plan grid and panel visibility, reorders/defaults the autopay control, and reduces scheduling to three fixed windows.

## Goals / Non-Goals

**Goals:**
- Four clearly separated steps with the add-ons concern isolated in its own step.
- Auto-skip the add-ons step when the provider offers none, with no empty page and no broken back-navigation.
- Three fixed installation windows, persisted compactly, rendered as an interval only where the user is actively choosing/reviewing the slot.
- Promote autopay by defaulting to it, without removing the ability to choose standard billing.

**Non-Goals:**
- No database schema migration. `scheduledAt` already stores the needed start hour.
- No change to payment capture, consent persistence, USPS validation, email/webhook delivery, or the confirmation celebration.
- No redesign of the add-ons UI itself — only its relocation into the Customize step.

## Decisions

### 1. Where the add-ons "skip" decision is made
The skip is decided at **plan-finalize time**, not by an unconditional redirect on the Customize page.

- A `finalizePlan` action persists `planId`/`providerId`, computes whether the provider has ≥1 active add-on, and redirects to `/checkout/customize` (has add-ons) or directly to `/checkout/details` (none).
- The `/checkout/customize` page keeps a **defensive guard**: if it is reached with zero active add-ons, it redirects to `/checkout/details`.

**Why over an unconditional auto-redirect on `/customize`:** if `/customize` always redirected-when-empty, browser-Back from Details would land on `/customize` and bounce forward again, trapping the user. Deciding at finalize time means a no-add-ons funnel never visits `/customize`, so Back from Details cleanly returns to `/plan`. The page guard remains only as a safety net for deep links.

### 2. Splitting `finalizePhase1`
`finalizePhase1` (plan + add-ons → `/details`) splits into:
- `finalizePlan(planId)` → validates plan + coverage, persists plan, clears any stale `addOnIds`, redirects per Decision 1.
- `finalizeAddOns(addOnIds)` → validates add-ons against the persisted plan's provider, persists `addOnIds`, redirects to `/details`.

The existing add-on validation logic (provider/active checks) moves into `finalizeAddOns`. Coverage and plan-availability checks stay in `finalizePlan`.

### 3. Installation time data model — persist start hour, format at the edge
Keep storing `scheduledAt` as `Date.UTC(y, m, d, startHour)` with `startHour ∈ {8, 10, 14}`; **no new column**. `scheduleSchema` changes `hour` from `min(8).max(17)` to an enum of `{8, 10, 14}`.

Rendering splits by location via a small formatter:
- **Interval** (`"8 – 10 AM"`) — only the Installation step's window selector and its review card.
- **Start hour** (`"8:00 AM"`) — confirmation page, order email, webhook payload, admin order views (these keep reading `scheduledAt` as today).

**Why over a new `installationWindow` column:** the start hour fully determines the two-hour window (windows are fixed and non-overlapping), so a column would be redundant state to keep in sync. Formatting is a pure function of the start hour.

### 4. Order-total panel visibility
Add `/checkout/plan` to the existing path-based hide list in `order-total-panel-client.tsx` (which already hides on `/checkout` and `/checkout/confirmation`). No structural change to the layout; the Plan page simply renders full-width when the panel is absent.

### 5. Autopay default + card order
In `phase2-form.tsx`, set the form's initial `autopay` to `true` and swap the two option cards' DOM order so "With autopay" is first (left). Keep the radiogroup/keyboard logic; only the default value and visual order change. The existing "do not block when autopay disabled" validation is unaffected.

### 6. Stepper and grid
`PHASES` gains a `Customize` entry (matching `/checkout/customize`). `phase1-form.tsx` plan grid moves from `sm:grid-cols-2` to a three-column layout at the large breakpoint (e.g. `sm:grid-cols-2 lg:grid-cols-3`), collapsing to one column on mobile.

## Risks / Trade-offs

- **Autopay-by-default adds friction for standard-billing users** → Intended (business goal). Mitigation: "Standard" remains one click away and the "do not block when autopay off" rule keeps that path frictionless once chosen.
- **Deep-link to `/checkout/customize` for a no-add-ons provider** → The page guard redirects to `/details`; harmless.
- **Downstream readers assume an exact appointment hour** → They already read `scheduledAt`; we only narrow the allowed start hours, so existing rendering keeps working. Only the Installation step opts into interval formatting.
- **Back-navigation across the skipped step** → Resolved by Decision 1 (skip decided at finalize, `/customize` never entered when empty). Review "Edit" links target Plan/Details directly.

## Migration Plan

- No DB migration. Existing orders with `scheduledAt` at non-window hours (legacy 8–17) remain valid historical data; only new submissions are constrained to `{8,10,14}`.
- Deploy is a standard app deploy. Legacy `/checkout/add-ons` redirect retargets to `/checkout/customize`.
- Rollback: revert the deploy; no data shape changed.

## Open Questions

None outstanding — the interval-in-review, autopay-default, and panel-on-Plan decisions were confirmed during exploration.
