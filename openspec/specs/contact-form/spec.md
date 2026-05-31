# contact-form Specification

## Purpose
TBD - created by archiving change add-contact-and-legal-pages. Update Purpose after archive.
## Requirements
### Requirement: Public contact page presents a contact form

The site SHALL serve a public `/contact` route rendering a contact form in US English with the fields: first name, last name, ZIP code, phone, email, and message, plus a required consent control and a submit action.

#### Scenario: Visitor opens the contact page

- **WHEN** an anonymous visitor loads `/contact`
- **THEN** the page renders a form with labeled inputs for first name, last name, ZIP code, phone, email, and message
- **AND** a consent checkbox with the TCPA disclaimer text is present and unchecked by default
- **AND** a submit button is present
- **AND** the footer "Contact" link points to `/contact` rather than a `mailto:` address

#### Scenario: Footer contact link is the page, not a mailto

- **WHEN** the public footer renders
- **THEN** the "Contact" entry links to `/contact`

### Requirement: Contact submissions are validated and require consent

The contact server action SHALL validate all fields with a schema and SHALL reject submissions where required fields are missing/invalid or the consent control is not accepted, returning field-level errors without persisting or notifying.

#### Scenario: Submission with missing or invalid fields

- **WHEN** the form is submitted with an empty required field, an invalid email, or a malformed ZIP
- **THEN** the action returns a non-ok result with field-level error messages
- **AND** no row is written to `contact_messages`
- **AND** no email or webhook is dispatched

#### Scenario: Submission without consent

- **WHEN** the form is submitted with the consent control not accepted
- **THEN** the action returns a non-ok result indicating consent is required
- **AND** no row is written to `contact_messages`

#### Scenario: Valid submission is accepted

- **WHEN** the form is submitted with all fields valid and consent accepted
- **THEN** the action persists a `contact_messages` row capturing the field values and the consent flag with status `new`
- **AND** the visitor sees a success confirmation
- **AND** the form does not retain the submitted values after success

### Requirement: Contact submissions notify the configured recipient

On a valid submission the system SHALL send an email to the address stored in the `notification_email` setting and SHALL dispatch the contact webhook, mirroring the order pipeline. Notification failures SHALL NOT discard the persisted submission.

#### Scenario: Email is sent to the configured recipient

- **WHEN** a valid contact submission is persisted and `notification_email` is configured
- **THEN** an email containing the submitter's name, email, phone, ZIP, and message is sent to that address via Resend
- **AND** the email reuses the existing Resend client and from-address configuration

#### Scenario: Notification destinations not configured

- **WHEN** a valid submission is persisted but `notification_email` or the Resend API key is not set
- **THEN** the submission still succeeds and is persisted
- **AND** the missing-configuration case is logged rather than surfaced as a user error

#### Scenario: Notification side effects fail

- **WHEN** the email or webhook dispatch fails after a submission is persisted
- **THEN** the persisted `contact_messages` row is retained
- **AND** the failure is logged
- **AND** the visitor still sees a success confirmation

### Requirement: Contact form mitigates automated spam

The contact form SHALL include a hidden honeypot field that is not visible to and not focusable by human users. Submissions where the honeypot is filled SHALL be silently discarded.

#### Scenario: Bot fills the honeypot

- **WHEN** a submission arrives with a non-empty honeypot field
- **THEN** the action returns a success-shaped response to the client
- **AND** no row is written to `contact_messages`
- **AND** no email or webhook is dispatched

#### Scenario: Honeypot is inaccessible to humans

- **WHEN** the contact form renders
- **THEN** the honeypot field is hidden from view, marked `aria-hidden`, and removed from the tab order

