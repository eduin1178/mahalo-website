## Context

Two independent product corrections are bundled in one change because the user requested a single change set.

1. **Checkout call window.** Today the final checkout step (`/checkout/schedule`) writes `orders.scheduledAt` (installation timestamp; the UTC hour encodes one of three windows — 8/10/14). `scheduleInstallation` in `lib/orders/draft-actions.ts` persists it and `submitOrder` requires it. The business needs the customer to instead pick a preferred window for the advisor's **confirmation call**; the installation date is set later by an agent via the existing back-office `RescheduleForm`.

2. **Hero provider logos.** `components/landing/hero.tsx` is a server component with a hardcoded `PROVIDER_WORDMARKS` array (6 names, mixed italic/weight classes). The provider catalog already feeds the landing carousel via `listProviders()` → `Provider[]` with `logoUrl`/`name`. The hero should use that same source with a single uniform name fallback.

Constraints: Next.js 16 App Router, Drizzle/Neon, all user-facing copy in English (US market). The window concept (8/10/14 with interval-vs-start-hour rendering) already exists in `lib/orders/installation-window.ts` and is reusable as-is.

## Goals / Non-Goals

**Goals:**
- Customer picks a preferred advisor-call window at the final step; persisted as `preferredCallAt`.
- `scheduledAt` (installation) becomes back-office-only; null on new orders.
- Order submission keyed on `preferredCallAt`, not `scheduledAt`.
- Consent reworded to cover the confirmation call; `CONSENT_VERSION` bumped for audit continuity.
- Admin order view shows the preferred call window (read-only) alongside the editable installation schedule.
- Hero renders DB-sourced provider logos with a uniform name fallback.

**Non-Goals:**
- Changing the three window values or the Mon–Sat calendar rule.
- Reworking the back-office installation scheduling UI (`RescheduleForm`) beyond surfacing the call window.
- Redesigning the hero layout, the marketing/provider disclaimer modal, or the landing carousel.
- Any change to the marketing opt-in (`PROVIDER_DISCLAIMER_PARAGRAPHS`).

## Decisions

### D1 — New column `preferredCallAt`, keep `scheduledAt` for installation
Add a nullable `orders.preferred_call_at timestamptz`. The UTC hour encodes the chosen window, identical to how `scheduledAt` works — so `lib/orders/installation-window.ts` helpers (`isValidWindowHour`, `intervalLabel`, `startLabel`) are reused unchanged for the call window.
- **Why:** Symmetric, additive, non-destructive. Installation and call are distinct concepts that now have distinct lifecycles (call = customer at checkout; installation = agent later). Overloading `scheduledAt` would conflate them and break the back office.
- **Alternative considered:** Repurpose `scheduledAt` to mean "call" and add a new `installationAt`. Rejected — far larger blast radius (every downstream reader of `scheduledAt` would flip meaning), and the back office already reads `scheduledAt` as installation.

### D2 — Reuse the existing schedule form and route
Keep the step at `/checkout/schedule` and reuse `ScheduleForm`; change only its copy ("When should our advisor call you?") and its target field/action. The window selector, calendar, consent block, and "Place order" button are unchanged structurally.
- **Why:** Minimal churn, preserves navigation guards and the stepper. Renaming the route would require legacy-redirect handling for no user benefit.
- **Naming note:** `lib/orders/installation-window.ts` is left as-is (the time blocks are identical); renaming it to a generic "time-window" module is optional cleanup, out of scope.

### D3 — Server action writes `preferredCallAt`; submit guard updated
`scheduleInstallation` (rename optional; keep export name to limit churn) validates the same window/date rules and writes `preferredCallAt` + consent stamp instead of `scheduledAt`. `submitOrder`'s completeness guard swaps `!draft.scheduledAt` → `!draft.preferredCallAt`.
- **Why:** The validation logic (window hour set, future date, not Sunday) is identical; only the destination column changes.

### D4 — Consent reword + version bump
Update `CONSENT_COPY.after` to explicitly mention the confirmation call, and bump `CONSENT_VERSION` from `"2026-05-31"` to a new date. The existing copy already authorizes phone contact "to process, verify, and activate this order"; the reword adds clarity ("a confirmation call at the time I selected"). The bump keeps `orders.termsVersion` auditable — old orders retain their accepted text.
- **Why:** The audit model is version-stamped; any wording change must bump the version or the stamp lies.

### D5 — Email + admin surface both times
Order email gains a "Preferred call time" section (start-hour rendering of `preferredCallAt`); the existing "Scheduled installation" line stays and reads "—" until an agent schedules. Admin order detail adds a read-only "Preferred call" field in the Schedule section, keeping `RescheduleForm` for installation.
- **Why:** The call center needs the call window; ops still needs the installation slot.

### D6 — Hero becomes data-driven
`page.tsx` fetches active providers (same `listProviders()` + `safeListProviders` tolerance pattern as `ProvidersGrid`) and passes them to `<Hero providers={...} />`. Hero maps providers: `logoUrl ? <img> : <span class="uniform">name</span>`. Remove `PROVIDER_WORDMARKS`. Logos render directly on the dark strip (per request: "like today"), monochrome/uniform text fallback.
- **Why:** Reuses the proven provider-fetch pattern; no new data layer.

## Risks / Trade-offs

- **Colored logos on the dark hero may look dull or invisible** → Accepted per explicit user choice ("like today, directly on the strip"). Mitigation: handle case-by-case after visual check; not blocking.
- **Orders created before the migration have null `preferredCallAt`** → They predate the feature; the admin simply shows "—". No backfill needed. Old orders still have `scheduledAt` from the previous flow.
- **`submitOrder` guard flip could let an order through without an installation date** → Intended: installation is now set later by an agent. Downstream consumers (email, webhook) must tolerate null `scheduledAt`.
- **Consent version bump invalidates nothing** → old stamps remain valid against their archived copy; only new acceptances use the new version. Low risk.
- **Bundling two unrelated changes inflates the review surface** → Trade-off accepted at user request; tasks are grouped so the hero slice can be reviewed/landed independently.

## Migration Plan

1. Add `preferred_call_at` column (additive Drizzle migration; no data loss).
2. Ship server-action + UI + consent + email + admin + hero changes together.
3. Rollback: the column is nullable and additive; reverting code leaves it unused/harmless. No destructive DDL.

## Open Questions

- None blocking. Optional follow-up: generalize `installation-window.ts` naming and consider whether the back-office installation scheduler should also expose the three fixed windows (currently out of scope).
