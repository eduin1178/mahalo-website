## ADDED Requirements

### Requirement: Coverage resolution SHALL treat fallback providers as last-resort, universal offerings

The provider availability resolution for a customer's ZIP SHALL distinguish fallback providers (those flagged `is_fallback`) from ordinary providers. Fallback providers SHALL be offered ONLY when no ordinary (non-fallback) active provider with at least one active plan covers the ZIP. When at least one ordinary provider qualifies, fallback providers SHALL be excluded from the results entirely, regardless of whether they have a matching coverage row. When no ordinary provider qualifies, every active fallback provider that has at least one active plan SHALL be offered, even if the ZIP is absent from that provider's `provider_coverage` rows (fallback providers are universal). Fallback providers SHALL still be subject to the existing "providers without active plans are not offered" rule. This requirement governs only the set of providers feeding the wizard; downstream routing (single-provider skip, multi-provider screen, empty state) operates on the resolved set unchanged.

#### Scenario: Ordinary provider exists — fallback excluded
- **WHEN** the ZIP is covered by at least one active non-fallback provider that has active plans
- **THEN** the resolved provider set SHALL contain only the qualifying non-fallback providers
- **AND** no fallback provider SHALL appear, even one whose `provider_coverage` includes that ZIP.

#### Scenario: No ordinary coverage — fallback surfaced universally
- **WHEN** no active non-fallback provider with active plans covers the ZIP
- **AND** at least one active fallback provider has active plans
- **THEN** the resolved provider set SHALL contain every qualifying fallback provider
- **AND** a fallback provider SHALL be included even when the ZIP is not present in its `provider_coverage` rows.

#### Scenario: Sole fallback skips the provider screen
- **WHEN** the resolved set contains exactly one provider (a fallback)
- **THEN** the wizard SHALL behave as for any single-provider ZIP, rendering that provider's plans directly on the Plan step without the provider-selection screen.

#### Scenario: Multiple fallbacks route through the provider screen
- **WHEN** the resolved set contains two or more fallback providers and no ordinary provider
- **THEN** the wizard SHALL render the `/checkout/provider` selection screen listing each fallback provider as a selectable card.

#### Scenario: Fallback without active plans is not offered
- **WHEN** no ordinary provider with active plans covers the ZIP
- **AND** the only fallback provider has no active plans
- **THEN** the resolved provider set SHALL be empty and the wizard SHALL render the no-coverage empty state.

#### Scenario: No coverage at all
- **WHEN** no active non-fallback provider with active plans covers the ZIP
- **AND** no active fallback provider with active plans exists
- **THEN** the resolved provider set SHALL be empty and the wizard SHALL render the no-coverage empty state.
