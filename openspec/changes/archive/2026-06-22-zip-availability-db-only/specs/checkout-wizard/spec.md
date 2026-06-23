## ADDED Requirements

### Requirement: ZIP availability SHALL be resolved from the database, not an external address service

Provider availability for a customer's ZIP SHALL be resolved solely from the application database (`provider_coverage` joined with `providers`, plus the fallback-provider rule). The resolution path SHALL NOT call an external postal/address service (USPS) to validate, normalize, or gate the ZIP. The only ZIP gate SHALL be the 5-digit format check (`/^\d{5}$/`) enforced at input time; a well-formed ZIP SHALL always reach database resolution. This requirement governs both draft creation (the ZIP search) and provider resolution feeding the wizard. The external address client MAY still be used by other flows (e.g. future Details-step address verification); this requirement constrains only the ZIP-availability path.

#### Scenario: Well-formed ZIP resolves from the database only

- **WHEN** a user submits a 5-digit ZIP and the system resolves available providers
- **THEN** the system SHALL query `provider_coverage`/`providers` (and the fallback rule) to build the provider set
- **AND** SHALL NOT call the USPS address service as part of that resolution.

#### Scenario: Well-formed but uncovered or unknown ZIP surfaces the fallback providers

- **WHEN** a user submits a 5-digit ZIP that no ordinary (non-fallback) active provider with active plans covers — including a ZIP that does not exist in any external postal database
- **THEN** the system SHALL resolve the active fallback provider(s) with active plans as the available set
- **AND** SHALL NOT return an address-lookup error (e.g. "We couldn't find that ZIP code") for that ZIP.

#### Scenario: Malformed ZIP is rejected before resolution

- **WHEN** a user submits a value that is not exactly five digits
- **THEN** the system SHALL reject it with a format validation message
- **AND** SHALL NOT create a draft or attempt provider resolution.

#### Scenario: Draft creation does not depend on an external address service

- **WHEN** `createDraftOrder` runs for a format-valid ZIP
- **THEN** it SHALL persist the draft with the validated ZIP and a null `installationAddress`
- **AND** SHALL NOT call the USPS address service
- **AND** an outage or rate-limit of that external service SHALL NOT block draft creation.
