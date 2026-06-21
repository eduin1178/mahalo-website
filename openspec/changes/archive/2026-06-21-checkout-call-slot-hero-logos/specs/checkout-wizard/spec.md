## ADDED Requirements

### Requirement: Final checkout step SHALL capture the customer's preferred advisor-call window

The final checkout step (step 4, `/checkout/schedule`) SHALL let the customer choose a preferred day and time window for the advisor's confirmation call, and SHALL require explicit consent before the order can be submitted. The date picker (selectable Monday–Saturday, future dates only) and the time-window selector SHALL sit side by side within the same card (date on the left, windows on the right). The step SHALL NOT render a read-only order review card and SHALL NOT render an order-total panel. The consent control and the primary submit action SHALL be the last elements on the page, and the primary submit action SHALL be labeled **"Place order"**. The chosen window SHALL be persisted to the order as `preferredCallAt`, and the checkout SHALL NOT set the installation schedule (`scheduledAt`).

#### Scenario: Loading the final step
- **WHEN** the user enters the final step with a complete draft
- **THEN** the page SHALL render a single card containing the date picker (left) and the time-window selector (right), followed by the consent control and finally the "Place order" submit button
- **AND** the step copy SHALL describe the selection as choosing when the advisor should call, not as scheduling an installation
- **AND** no order-review card and no order-total panel SHALL be present.

#### Scenario: Submitting the order
- **WHEN** the user picks a valid call window, accepts the consent disclaimer, and clicks "Place order"
- **THEN** the system SHALL persist the chosen window to `preferredCallAt` and the consent proof, submit the order via the server action, and navigate to `/checkout/confirmation`
- **AND** the order's `scheduledAt` (installation) SHALL remain null.

### Requirement: The advisor-call window selector SHALL offer exactly three fixed time windows

The final step SHALL offer exactly three selectable call windows: **8–10 AM**, **10 AM–12 PM**, and **2–4 PM**. No other times SHALL be selectable. The order SHALL persist only the **start hour** of the chosen window (one of `8`, `10`, `14`) in `preferredCallAt`. The two-hour **interval** form (e.g. "8 – 10 AM") SHALL be rendered ONLY inside the selector; wherever the preferred call window is displayed downstream (confirmation page, order email, webhook payload, admin order views) it SHALL render the **start hour** (e.g. "8:00 AM").

#### Scenario: Time-window options
- **WHEN** the call-window selector renders for a chosen date
- **THEN** it SHALL present exactly three options labeled "8 – 10 AM", "10 – 12 PM", and "2 – 4 PM"
- **AND** no other time options SHALL be present.

#### Scenario: Server rejects an out-of-set window
- **WHEN** a submission arrives with a start hour other than 8, 10, or 14
- **THEN** the server action SHALL reject it with a user-facing error and SHALL NOT persist the call window.

#### Scenario: Start hour shown downstream
- **WHEN** the preferred call window is rendered on the confirmation page, in the order email, in the webhook payload, or in an admin order view
- **THEN** it SHALL display the window start hour (e.g. "8:00 AM") and SHALL NOT render the interval.

### Requirement: Order submission SHALL require a preferred call window

The order-finalization server action SHALL treat a draft as complete only when it has a persisted `preferredCallAt`. It SHALL NOT require `scheduledAt` (installation) to submit the order.

#### Scenario: Submit without a preferred call window
- **WHEN** the finalization server action runs for a draft that has no `preferredCallAt`
- **THEN** it SHALL return a user-facing error and SHALL NOT move the order out of `Draft`.

#### Scenario: Submit with a preferred call window and consent
- **WHEN** the finalization server action runs for a draft that has `preferredCallAt` and recorded consent proof
- **THEN** it SHALL materialize the order regardless of whether `scheduledAt` is set.

### Requirement: Installation scheduling SHALL be a back-office responsibility

After checkout, an order's installation schedule (`scheduledAt`) SHALL be null until an agent sets it in the back office. The admin order detail SHALL display the customer's preferred advisor-call window as read-only information alongside the editable installation schedule control. Installation time, when set, SHALL render as the window start hour wherever it is displayed downstream.

#### Scenario: New order has no installation schedule
- **WHEN** a customer completes checkout
- **THEN** the resulting order SHALL have a populated `preferredCallAt` and a null `scheduledAt`.

#### Scenario: Admin sees the preferred call window and edits installation
- **WHEN** an agent opens the order detail in the back office
- **THEN** the page SHALL show the customer's preferred call window as read-only text
- **AND** SHALL present the existing installation-scheduling control to set or change `scheduledAt`.

## MODIFIED Requirements

### Requirement: Final phase SHALL capture explicit consent before an order can be submitted

The final checkout phase (`/checkout/schedule`) SHALL present a single consent control, positioned next to the order-submission control on the same page, that the user MUST affirmatively accept before the order can be submitted. The consent control SHALL combine acceptance of the Terms of Service and the Privacy Policy with an opt-in authorizing Mahalo and its authorized partners to contact the customer — including by a confirmation call at the time the customer selected — to confirm, verify, and activate the order. The consent text SHALL link to `/legal/terms` and `/legal/privacy`, SHALL be in English (US market), and the control SHALL NOT be pre-checked.

#### Scenario: Consent control is rendered next to the submit control
- **WHEN** the user enters the final phase with a complete draft
- **THEN** the page SHALL render an unchecked consent checkbox on the same page as, and adjacent to, the "Place order" control
- **AND** the consent text SHALL include inline links to the Terms of Service (`/legal/terms`) and the Privacy Policy (`/legal/privacy`)
- **AND** the consent text SHALL state that the customer authorizes being contacted to confirm the order.

#### Scenario: Consent is not pre-checked
- **WHEN** the final phase first renders
- **THEN** the consent checkbox SHALL be unchecked
- **AND** the "Place order" control SHALL be disabled until a valid call window is chosen AND the consent checkbox is checked.

#### Scenario: Attempting to submit without consent (client)
- **WHEN** the user has chosen a valid call window but the consent checkbox is unchecked and attempts to submit
- **THEN** the system SHALL prevent submission and display a validation message indicating consent is required.

#### Scenario: Attempting to submit without consent (server)
- **WHEN** a submission reaches the server action without recorded consent
- **THEN** the server action SHALL reject the submission with a user-facing error and SHALL NOT advance the order.

## REMOVED Requirements

### Requirement: Installation step SHALL combine scheduling and final review in a single view
**Reason**: The customer no longer schedules the installation during checkout; the final step now captures the preferred advisor-call window.
**Migration**: Superseded by "Final checkout step SHALL capture the customer's preferred advisor-call window". The step keeps the same route, single-card layout, consent control, and "Place order" action; only the meaning of the selection and the persisted field (`preferredCallAt` instead of `scheduledAt`) change.

### Requirement: Installation scheduling SHALL offer exactly three fixed time windows
**Reason**: Installation is no longer scheduled by the customer at checkout.
**Migration**: Superseded by "The advisor-call window selector SHALL offer exactly three fixed time windows" — the same three windows (8–10 AM, 10–12 PM, 2–4 PM) now apply to the advisor-call selection.

### Requirement: Installation time SHALL persist the window start hour and render as an interval only in the scheduling step
**Reason**: The customer-facing installation scheduling step no longer exists; window persistence/rendering now applies to the preferred call window.
**Migration**: Superseded by "The advisor-call window selector SHALL offer exactly three fixed time windows" (interval shown only in the selector; start hour shown downstream). Installation time, when set by an agent in the back office, continues to render as the window start hour downstream, per "Installation scheduling SHALL be a back-office responsibility".
