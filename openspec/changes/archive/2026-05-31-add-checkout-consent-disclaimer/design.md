## Context

The checkout finalizes through a **two-stage terminal** that must be understood before placing the consent gate:

```
/checkout/schedule (ScheduleForm)              /checkout/confirmation
  "Confirm order" ── scheduleInstallation ──▶  submitOrder()
   (user's act of will)   (sets scheduledAt,     (status → Pending,
                           redirects)             email, n8n webhook,
                                                  deletes draft cookie)
```

The user's decision to buy happens at the "Confirm order" button in `components/checkout/schedule-form.tsx`. `scheduleInstallation` (in `lib/orders/draft-actions.ts`) only sets `scheduledAt` and redirects; the order is actually materialized by `submitOrder`, which runs on the confirmation page **with no UI** (it auto-runs when `status === "Draft"`).

Constraints:
- PerfectVision guidelines require privacy policy + disclaimer + opt-in **next to the form, same page**, and treat that submission as "consent for contact." Fines up to $500/violation.
- `tareas.md` requires accepting Terms of Service + Privacy Policy before purchase.
- US-market copy MUST be English (`AGENTS.md` overrides the global Spanish rule for this repo).
- A consent precedent already exists: `contact_messages.consent boolean` + `contact-form.tsx` uses `z.literal(true)`.

## Goals / Non-Goals

**Goals:**
- A single, low-friction, non-pre-checked consent control adjacent to "Confirm order" on `/checkout/schedule`.
- Block submission (client and server) until consent is given.
- Persist defensible proof of consent (timestamp + copy version) on the `orders` row.
- Reuse the existing TCPA-style consent pattern and the already-shipped `/legal/terms` and `/legal/privacy` pages.

**Non-Goals:**
- A separate marketing opt-in checkbox (contact here is transactional — required to fulfill the order — not marketing).
- Rewriting the two-stage terminal flow or the stepper.
- Authoring/altering the legal page content (links only).
- Per-order storage of the full consent text body (we store a version identifier, not the prose).

## Decisions

### Decision 1: Single combined checkbox, framed as transactional consent
One required checkbox combines (A) Terms of Service + Privacy Policy acceptance and (B) opt-in to be contacted to process/activate the order.

- **Why:** The confirmation copy already states an agent will call to verify identity (SSN/DOB) before activation — contact is **inherent to fulfilling the order**, so it is transactional, not marketing. TCPA's "marketing consent cannot be a condition of purchase" rule therefore does not apply, and a single bundled checkbox is both compliant and lowest-friction.
- **Alternatives considered:** (1) Two checkboxes (contractual gate + optional marketing opt-in) — more compliant-by-separation but adds friction the user explicitly wants to avoid, and there is no marketing contact to opt into yet. (2) No checkbox, implicit consent via a footer note — fails the PDF's explicit opt-in requirement.

### Decision 2: Capture consent in `scheduleInstallation`, guard in `submitOrder`
The checkbox value is sent in the `scheduleInstallation` payload; that action validates it (`z.literal(true)`) and writes `termsAcceptedAt`/`termsVersion` in the same DB update that sets `scheduledAt`. `submitOrder` then refuses to leave `Draft` if `termsAcceptedAt` is null.

- **Why:** `scheduleInstallation` is the only server action that runs **with the user's checkbox value in scope**. `submitOrder` runs headless on the confirmation page, so it cannot itself collect consent — it can only verify it. Writing in `scheduleInstallation` + verifying in `submitOrder` gives capture-at-source plus defense-in-depth against a draft reaching confirmation without consent.
- **Alternatives considered:** Persist via a dedicated `recordConsent` action before scheduling — extra round trip and state to reconcile, no benefit.

### Decision 3: Store `termsAcceptedAt` (timestamptz) + `termsVersion` (varchar) on `orders`
Two new nullable columns on the existing `orders` table, set at submission. `termsVersion` references a constant (e.g. a date-stamped identifier) co-located with the consent copy in `lib/legal/`.

- **Why:** Mirrors the `contact_messages.consent` precedent and keeps proof on the order it belongs to. Storing the **version** (not the full text) keeps the row small while remaining defensible: the versioned copy is recoverable from source control. Nullable (not `NOT NULL`) avoids breaking historical/in-flight draft rows; the server guard enforces presence at finalization instead of at the column level.
- **Alternatives considered:** (1) `NOT NULL` column — breaks existing draft rows and the multi-step draft lifecycle. (2) A separate `order_consents` table — over-engineered for a 1:1 relationship. (3) Client-only validation, no persistence — rejected by the user; leaves no audit trail.

### Decision 4: Single source of truth for consent copy + version
The disclaimer string and its version identifier live in one module under `lib/legal/` and are imported by both the UI (display) and the server action (version stamping).

- **Why:** Prevents drift between what the user sees and what gets stamped; makes future copy revisions a one-line version bump.

## Risks / Trade-offs

- **Bundling contractual acceptance with contact opt-in could be challenged** → Mitigation: scope the contact language strictly to "process and activate this order" (transactional), keep Terms/Privacy links inline, and store the accepted version so the exact wording is auditable. Flag the final copy for legal sign-off.
- **Nullable columns mean an order could theoretically be finalized without proof if a code path bypasses the guard** → Mitigation: the `submitOrder` guard is the single finalization path (confirmation page auto-runs it); add the guard as an explicit early return with a user-facing error.
- **Migration on a live `orders` table** → Mitigation: additive, nullable columns only — no backfill, no lock on write-heavy paths; safe to deploy ahead of the UI.
- **Copy must be English despite Spanish UI elsewhere in repo** → Mitigation: spec and design both call this out; reviewer checks against `AGENTS.md`.

## Migration Plan

1. Add `termsAcceptedAt` (timestamptz, nullable) and `termsVersion` (varchar, nullable) to `orders` in `lib/db/schema.ts`; generate and apply the Drizzle migration. Additive and reversible (drop columns to roll back).
2. Deploy schema first; existing flow keeps working (columns simply stay null).
3. Ship the consent module, UI checkbox, and server-action changes together.
4. Rollback: revert the app changes; columns can remain harmlessly or be dropped in a follow-up migration.

## Open Questions

- Final consent **copy wording** needs legal sign-off (the draft in the proposal is a functional starting point).
- `termsVersion` format — date string (e.g. `2026-05-31`) vs semantic version. Date string is simplest and aligns with the legal pages' "Last Updated" date; assume date string unless told otherwise.
