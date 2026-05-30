## ADDED Requirements

### Requirement: Webhook payloads use a unified envelope

All outbound webhook payloads to the configured `webhook_url` SHALL use a single envelope shape `{ eventType, emittedAt, data }`, where `eventType` is a dotted event identifier, `emittedAt` is an ISO-8601 timestamp, and `data` is the event-specific object. Event-specific fields SHALL live under `data` and SHALL NOT be placed at the top level of the payload.

#### Scenario: Envelope shape is consistent across events

- **WHEN** any webhook is dispatched
- **THEN** the JSON body has exactly the top-level keys `eventType`, `emittedAt`, and `data`
- **AND** `eventType` is a non-empty dotted string
- **AND** all event-specific content is nested under `data`

#### Scenario: Dispatch keeps existing delivery semantics

- **WHEN** a webhook is dispatched and `webhook_url` is not configured
- **THEN** the dispatch is skipped without error
- **AND** when configured, delivery retains the established timeout and retry-with-backoff behavior

### Requirement: Order submission emits order.submitted under the envelope

The order webhook SHALL emit `eventType: "order.submitted"` with the order, customer, provider, plan, add-ons, and totals nested under `data`. **BREAKING**: this replaces the previous flat payload in which those fields were top-level.

#### Scenario: Order webhook uses the envelope

- **WHEN** an order is submitted and the webhook fires
- **THEN** the body is `{ eventType: "order.submitted", emittedAt, data: { order, customer, provider, plan, addOns, totals } }`
- **AND** no order field appears at the top level of the payload

### Requirement: Contact submission emits contact.submitted under the envelope

A contact submission SHALL dispatch a webhook with `eventType: "contact.submitted"` and the contact message nested under `data`.

#### Scenario: Contact webhook uses the envelope

- **WHEN** a valid contact submission is persisted
- **THEN** a webhook with body `{ eventType: "contact.submitted", emittedAt, data: { message } }` is dispatched to `webhook_url`
- **AND** `data.message` contains the submitter's first name, last name, email, phone, ZIP, message, and consent flag
