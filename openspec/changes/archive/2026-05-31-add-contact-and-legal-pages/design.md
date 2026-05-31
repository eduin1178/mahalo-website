## Context

The public site (`app/(public)/`) already routes `/legal/privacy` and `/legal/terms`, both rendering placeholder copy that defers to "client (T21)". There is no `/contact` route; the footer "Contact" entry is a `mailto:`. The order-submission pipeline already implements everything the contact form needs to mirror:

- `getSetting("notification_email")` reads the admin-configured destination ([lib/settings/queries.ts](../../../lib/settings/queries.ts)).
- `getResend()` returns a Resend client or `null`, with a graceful mock-logging fallback when `RESEND_API_KEY` is unset ([lib/resend/client.ts](../../../lib/resend/client.ts)).
- `sendNewOrderEmail` + `renderNewOrderEmail` show the action→template split ([lib/resend/send.ts](../../../lib/resend/send.ts)).
- `triggerWebhook` posts to `webhook_url` with timeout + retry ([lib/webhook/trigger.ts](../../../lib/webhook/trigger.ts)), currently emitting a flat `{ event, order, ... }` payload.
- Server actions validate with zod and return `{ ok, error, fieldErrors }` ([lib/orders/draft-actions.ts](../../../lib/orders/draft-actions.ts)).
- The admin panel uses a role-filtered nav (`visibleNavFor`) plus per-page `requireRole` ([components/admin/nav-config.ts](../../../components/admin/nav-config.ts)).

Constraints: Next.js 16 App Router, Tailwind v4, shadcn/ui, Drizzle/Neon, Clerk, Resend. No new runtime dependencies. All public-facing copy in US English (per the `public-landing` spec and US jurisdiction).

## Goals / Non-Goals

**Goals:**
- Real, compliance-grade Privacy Policy and Terms of Service rendered as static server components.
- A public contact form that validates input, requires TCPA consent, mitigates spam, persists to the DB, and emails the configured recipient.
- Backoffice access (admin + agent) to list, view, and triage (read/archived) contact submissions.
- A single unified `{ eventType, data }` webhook envelope for both order and contact events.
- Zero new npm packages and zero new settings keys.

**Non-Goals:**
- Cookie-consent banner and analytics/pixel installation (GA4, Meta Pixel, Consent Mode v2). Disclosed in policy text only; implementation deferred to a separate change.
- Replying to messages from inside the panel (read/archived lifecycle only).
- Internationalization / bilingual legal content.
- Captcha/Turnstile (honeypot only for this change).
- Changing the checkout flow, customer model, or any existing table.

## Decisions

### D1. Separate `contact_messages` table, not the `customers` table
Contact leads are persisted to a new `contact_messages` table rather than reusing `customers`.
- **Rationale**: `customers.email` is `unique` and FK-linked to `orders`; a contact lead is an unqualified, repeatable submission. Mixing them would corrupt the order model and break the unique constraint when the same person writes twice.
- **Schema** (mirrors existing table conventions — uuid PK, `timestamptz` defaults, indexes):
  ```
  contact_messages
    id          uuid PK default gen_random_uuid()
    first_name  varchar(80)   notNull
    last_name   varchar(80)   notNull
    email       varchar(254)  notNull          -- NOT unique
    phone       varchar(32)   notNull
    zip_code    varchar(5)    notNull
    message     text          notNull
    consent     boolean       notNull          -- TCPA proof-of-consent
    status      varchar(16)   notNull default 'new'   -- new | read | archived
    created_at  timestamptz   notNull defaultNow
    index(status), index(created_at)
  ```
- **Alternative considered**: extend `customers` with a `source` column — rejected for the unique-email and order-FK reasons above.

### D2. Mirror the order pipeline for the contact action
`lib/contact/actions.ts` exposes a `"use server"` `submitContact(input)` that: validates with zod (consent must be `true`), checks the honeypot, inserts into `contact_messages`, then runs `Promise.allSettled([sendContactEmail(id), triggerContactWebhook(id)])` — side-effect failures are logged, never thrown, so a Resend/n8n outage cannot lose a persisted lead.
- **Rationale**: identical shape to `submitOrder`, so the team reads one pattern. Persist-first guarantees the lead survives even if email/webhook fail.
- **Email**: new `lib/resend/templates/contact.ts` `renderContactEmail(row)` returning `{ subject, html, text }`, reusing the existing HTML-escape helper pattern and Mahalo brand styling. `sendContactEmail` reads `notification_email` and uses `getResend()` with the same mock fallback.

### D3. Unified webhook envelope `{ eventType, data }` (BREAKING)
Refactor `triggerWebhook` so every payload is `{ eventType: string, emittedAt: string, data: {...} }`. Order events become `{ eventType: "order.submitted", data: { order, customer, provider, plan, addOns, totals } }`; contact events are `{ eventType: "contact.submitted", data: { message } }`.
- **Approach**: extract a small `postWebhook(eventType, data)` core that keeps the existing timeout (5s) + retry (2 attempts, 2s backoff) + `webhook_url` skip behavior, and have both `triggerWebhook(orderId)` and a new `triggerContactWebhook(messageId)` build their `data` and delegate to it.
- **Rationale**: one parser contract on the n8n side; new event types are additive. The user explicitly chose to standardize both over leaving two formats.
- **Trade-off**: breaking change — the existing n8n `order.submitted` node must read `body.data.*` instead of `body.*`. Acknowledged and accepted; called out in the migration plan.
- **Alternative considered**: contact-only envelope, orders untouched — rejected to avoid two coexisting payload shapes.

### D4. Spam mitigation: honeypot only
A visually hidden, `aria-hidden`, non-tabbable `company` field. If non-empty on submit, the action returns a success-shaped response without persisting or notifying (silent drop).
- **Rationale**: near-zero cost, no dependency, stops the bulk of naive bots. The user chose "whatever is easiest"; Turnstile is explicitly deferred.
- **Trade-off**: won't stop a targeted bot. Acceptable for a contact form; can be upgraded later without schema change.

### D5. Admin Messages section reuses the nav contract
Add `"messages"` to the `NavIconKey` union, a `{ label: "Messages", href: "/admin/messages", icon: "messages", adminOnly: false }` nav item, and register a lucide icon (`Mail`) in `sidebar-nav.tsx`'s `ICONS` map. The page is `app/admin/(panel)/messages/page.tsx` with `requireRole(["admin","agent"])`, mirroring the customers list; `[id]/page.tsx` shows one message. `lib/contact/queries.ts` provides `listContactMessages`, `getContactMessage`, and `countNewMessages` for the badge. Read/archived transitions are server actions revalidating the list.
- **Rationale**: `adminOnly: false` matches Orders/Customers — leads are sales follow-up material agents should see. Access control is already enforced by `visibleNavFor` + `requireRole`, so no new auth code.
- **Badge**: `countNewMessages()` (status = 'new') rendered next to the Messages label; computed in the admin layout/server component, not polled client-side.

### D6. Legal pages stay static server components
Both pages remain plain server components with semantic, accessible long-form content (`<h1>/<h2>`, lists, `Last Updated` date) inside the existing `max-w-3xl` article shell. Privacy Policy is adapted from the partner template but rewritten to match Mahalo's actual data flows (payment data for autopay, USPS, Clerk, n8n, Resend, R2) and ad-platform disclosure requirements (cookies/pixels, advertising partners, Do-Not-Sell/Share, opt-out, business identity, COPPA). Terms are derived from the `checkout-wizard` spec.
- **Rationale**: no interactivity needed; static SSR is cheapest and most cache-friendly. Copying the template verbatim would assert false practices (the template claims "we do not collect payment information" — Mahalo does).

## Risks / Trade-offs

- **n8n breakage on deploy (D3)** → Ship the n8n envelope update in lockstep with this change; the retry+timeout already prevents a failed webhook from blocking the order/contact action, so worst case is a missed notification, not a lost record.
- **Privacy Policy makes legal claims** → Copy must reflect real data practices; have the client/legal review before public launch. The page carries a `Last Updated` date to track revisions. Placeholder business identity (address/phone) must be replaced with real values before launch.
- **Honeypot insufficient against targeted spam (D4)** → Accepted; upgrade path to Turnstile is isolated to the form + action with no schema impact.
- **Persisted PII in `contact_messages`** → Same Neon DB and handling as `customers`; covered by the new Privacy Policy retention/security sections. No payment data is collected by the contact form.
- **Change size** → Spans DB + public + admin + webhook, likely exceeding the ~400-line review budget. Slice into chained PRs along the four capability boundaries (legal-pages → contact-form+webhook → admin-messages) at the tasks stage.

## Migration Plan

1. Add `contact_messages` to the Drizzle schema and generate the migration (`db/migrations/0001_*.sql`); apply to Neon.
2. Land the unified webhook envelope and update the n8n workflow's `order.submitted` node to read `body.data.*`; add a branch/handler for `contact.submitted`.
3. Ship contact form, email template, legal content, and admin Messages section.
4. Repoint the footer Contact link to `/contact`.
5. **Rollback**: revert the code; the additive `contact_messages` table can remain (unused) or be dropped via a down migration. The webhook envelope is the only breaking surface — reverting the code restores the flat payload, so n8n must be reverted in step with any rollback.

## Open Questions

- Real business identity (legal entity name, physical address, support email, phone) for the Privacy Policy contact section and footer — needed before public launch; placeholders used until provided.
- Governing-law jurisdiction (state) for the Terms — assume the dealer's operating state; confirm with client.
