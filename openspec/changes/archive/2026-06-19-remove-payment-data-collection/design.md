## Context

A site review requires that the website stop collecting credit card data; that information is to be taken over the phone. Today the Details step (`/checkout/details`) couples two distinct concepts:

1. **Autopay** — a price preference. Plans carry `priceStandard` and `priceAutopay`; plan cards make the autopay price the protagonist; `orders.autopay_enabled`, the order email, and the n8n webhook all carry the autopay flag.
2. **Payment instrument** — the actual card/ACH details, stored as plain-text JSON in `orders.payment_data` and shown in the admin order view.

The two are entangled: choosing autopay forces the user to enter a card or ACH. Verified facts that shape this design:

- No payment processor is wired in; `payment_data` is never used to charge anyone.
- The email template (`lib/resend/templates/new-order.ts`) and webhook (`lib/webhook/trigger.ts`) send only the autopay flag and prices — **never** the instrument. So no outbound integration changes are needed.
- `payment_data` is read in exactly one place: the admin `PaymentDataView`.

## Goals / Non-Goals

**Goals:**
- Remove all collection, validation, storage, and display of payment instruments (card **and** ACH) from checkout and backoffice.
- Drop `orders.payment_data` with a destructive migration so no plain-text instrument remains in the database.
- Preserve autopay entirely as a price preference, including pricing, plan-card emphasis, and the email/webhook flag.

**Non-Goals:**
- Removing or redesigning autopay pricing.
- Integrating a payment processor or building a phone-collection workflow in the app (out of scope; handled operationally by sales).
- Changing the email or webhook payloads.

## Decisions

### Decision 1: Decouple autopay from payment collection (keep autopay)

Autopay stays as a stated preference; the instrument is collected by phone. `autopay_enabled` continues to drive pricing and flows to the email/webhook unchanged.

- **Why**: Autopay is the product's pricing model — the plan-card hierarchy and quoted price depend on it. Removing it would be a far larger product change and contradicts the existing marketing emphasis.
- **Alternative considered**: Remove autopay entirely (drop `autopay_enabled` and `priceAutopay`). Rejected — disproportionate blast radius, rewrites plan cards and pricing, and unrequested.

### Decision 2: Remove both card and ACH (not just card)

Eliminate the entire `payment_data` concept rather than only the card branch.

- **Why**: ACH (routing + account) is at least as sensitive as a card number and is stored in the same plain-text column; keeping it would leave the same liability and a half-built form. The intent is to take the site out of payment-data scope, not to swap one instrument for another.
- **Alternative considered**: Keep ACH, remove only card. Rejected — leaves `payment_data`, the admin viewer, and PII exposure in place.

### Decision 3: Destructive `DROP COLUMN` migration

Generate a Drizzle migration that runs `ALTER TABLE orders DROP COLUMN payment_data` after the column and its types are removed from `lib/db/schema.ts`.

- **Why**: A nullable-but-unused column would leave existing plain-text instruments in the database, which does not satisfy the review. Dropping the column is the only option that actually removes the stored data.
- **Alternative considered**: Keep the column, stop writing, scrub rows with an UPDATE. Rejected — more steps, leaves the schema carrying a dead PII column, and easier to reintroduce by accident.

### Decision 4: Replace, don't blank, the payment UI

In the Details form, the autopay-on branch renders a short notice ("A Mahalo agent will call you to set up your payment method") instead of the Card/ACH tabs. In the admin order view, the Payment section shows the autopay state and a "collected by phone" note instead of `PaymentDataView` (which is deleted).

- **Why**: Preserves the visual rhythm of both screens and communicates the new operational reality rather than leaving an empty section that reads as a bug.

## Risks / Trade-offs

- **Destructive, irreversible data loss** → By design. The data is plain-text PII with no consumer; dropping it is the objective. Ensure the migration is reviewed and run intentionally; no rollback of the data is expected or wanted.
- **In-flight drafts that already stored `payment_data`** → The column drop discards it; those orders fall back to phone collection like any other. The `submitOrder` guard that required payment data is removed, so they can still be submitted.
- **Schema/type churn touches several files** → Removing `PaymentData`/`CardPayment`/`AchPayment` will surface TypeScript errors anywhere they are imported (`queries.ts` re-export, admin view). Following the compiler to zero errors is the completion signal.
- **Forgetting the migration regenerates drift** → Editing `schema.ts` without generating the SQL migration leaves the live DB and schema out of sync. The migration step is mandatory, not optional.

## Migration Plan

1. Edit `lib/db/schema.ts`: remove the `paymentData` column and the `CardPayment` / `AchPayment` / `PaymentData` types.
2. Generate the Drizzle migration (`drizzle-kit generate`) and confirm it emits `DROP COLUMN payment_data`.
3. Remove all code references (checkout, server actions, admin view, query re-export) so the project type-checks.
4. Apply the migration to the database as part of deploy.
5. Rollback strategy: none for the data (intentional). Reverting the code change would require re-adding the column, but the dropped instruments are unrecoverable — acceptable per the requirement.
