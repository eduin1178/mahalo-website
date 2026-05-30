## Why

The public site ships with placeholder Privacy Policy and Terms of Service pages and has no real contact channel (the footer link is a bare `mailto:`). This blocks two things at once: legal/compliance coverage required to run paid acquisition (Google Ads and Meta review the landing page and privacy policy before approving a lead-gen advertiser), and a first-party way for prospects to reach the dealer. Mahalo operates as an authorized reseller funnel, so credible legal pages and a compliant contact form are prerequisites for launch, not nice-to-haves.

## What Changes

- Replace the placeholder `/legal/privacy` page with a complete Privacy Policy that discloses Mahalo's real data practices (including payment data captured for autopay, USPS address validation, third-party providers, Resend, Cloudflare R2, n8n) and meets ad-platform disclosure requirements: cookies/pixels, advertising partners, "Do Not Sell or Share" (CCPA/CPRA), opt-out paths, business identity, and children's privacy.
- Replace the placeholder `/legal/terms` page with Terms of Service derived from the checkout-wizard functionality (reseller relationship, order process, payment/autopay authorization, indicative pricing, third-party providers, disclaimers, limitation of liability, governing law).
- Add a public `/contact` page with a form (first name, last name, ZIP, phone, email, message) and a required TCPA consent disclaimer, plus a hidden honeypot field for spam mitigation.
- Persist each submission to a new `contact_messages` table and notify the configured `notification_email` via Resend, mirroring the existing order-notification pipeline.
- **BREAKING**: Standardize the n8n webhook payload to a `{ eventType, data }` envelope. The order webhook moves from its current flat `{ event, order, ... }` shape to `{ eventType: "order.submitted", data: {...} }`, and contact submissions emit `{ eventType: "contact.submitted", data: {...} }`. The n8n workflow consuming `order.submitted` must be updated to read the new envelope.
- Add a backoffice **Messages** section (visible to admin and agents) to list contact submissions, view a single message, and mark messages as read/archived, with a "new" count badge in the admin sidebar.
- Point the footer "Contact" link to `/contact` instead of the `mailto:`.

## Capabilities

### New Capabilities
- `legal-pages`: Privacy Policy and Terms of Service content pages with compliance-grade disclosures and accessible routing from the public site.
- `contact-form`: Public contact form that validates input, enforces consent, mitigates spam, persists submissions, and dispatches an email notification.
- `webhook-notifications`: Unified `{ eventType, data }` webhook envelope covering `order.submitted` and `contact.submitted` events to the configured n8n endpoint.
- `admin-messages`: Backoffice listing, detail view, and read/archived lifecycle for contact submissions, scoped to admin and agent roles.

### Modified Capabilities
<!-- No existing spec's requirements change. The order webhook payload change is captured under the new webhook-notifications capability. -->

## Impact

- **New routes**: `app/(public)/contact/`, `app/admin/(panel)/messages/` (list + detail).
- **New code**: `lib/contact/` (server actions, queries), `lib/resend/templates/contact.ts`, `components/contact/`, `components/admin/messages/`.
- **Modified code**: `app/(public)/legal/privacy/page.tsx`, `app/(public)/legal/terms/page.tsx` (placeholder → real content); `lib/webhook/trigger.ts` (envelope refactor — **breaking for n8n**); `lib/db/schema.ts` (+`contact_messages` table); `components/admin/nav-config.ts` and `components/admin/sidebar-nav.tsx` (+Messages nav + icon); `components/landing/nav-config.ts` (footer Contact link).
- **Database**: new `contact_messages` table + Drizzle migration. No changes to existing tables.
- **External**: n8n workflow must adopt the new `{ eventType, data }` envelope. Reuses existing `notification_email`/`webhook_url` settings, Resend client, and Clerk role gating — no new dependencies and no new settings keys.
- **Out of scope**: cookie-consent banner and actual analytics/pixel installation (GA4, Meta Pixel, Consent Mode v2). The privacy policy discloses these practices in text; wiring the tracking stack is deferred to a separate change.
