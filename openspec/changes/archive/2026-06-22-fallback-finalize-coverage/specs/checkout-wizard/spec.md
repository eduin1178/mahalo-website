## MODIFIED Requirements

### Requirement: Coverage resolution SHALL treat fallback providers as last-resort, universal offerings

The provider availability resolution for a customer's ZIP SHALL distinguish fallback providers (those flagged `is_fallback`) from ordinary providers. Fallback providers SHALL be offered ONLY when no ordinary (non-fallback) active provider with at least one active plan covers the ZIP. When at least one ordinary provider qualifies, fallback providers SHALL be excluded from the results entirely, regardless of whether they have a matching coverage row. When no ordinary provider qualifies, every active fallback provider that has at least one active plan SHALL be offered, even if the ZIP is absent from that provider's `provider_coverage` rows (fallback providers are universal). Fallback providers SHALL still be subject to the existing "providers without active plans are not offered" rule. The same resolved availability set SHALL be the single source of truth for BOTH discovery (the providers and plans shown in the wizard) AND finalize-time validation (server actions that persist the customer's chosen provider or plan): a provider or plan that the resolution surfaces for a ZIP SHALL be accepted when the customer selects it, and one that the resolution excludes SHALL be rejected. Finalize-time validation SHALL NOT re-derive coverage with a stricter rule than discovery (for example, one that excludes fallback providers or requires a matching `provider_coverage` row), so that a displayed fallback offering remains selectable through checkout.

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

#### Scenario: Selecting a fallback plan on an uncovered ZIP is accepted
- **WHEN** no ordinary provider with active plans covers the customer's ZIP
- **AND** the wizard surfaced a fallback provider's plan and the customer selects it
- **THEN** the finalize-plan action SHALL persist the selected plan and advance the wizard
- **AND** the action SHALL NOT reject it with a "not available for your ZIP" error.

#### Scenario: Selecting a fallback provider on an uncovered ZIP is accepted
- **WHEN** no ordinary provider with active plans covers the customer's ZIP
- **AND** two or more fallback providers were surfaced and the customer selects one
- **THEN** the finalize-provider action SHALL persist the selected provider and advance to the Plan step
- **AND** the action SHALL NOT reject it with a "not available for your ZIP" error.

#### Scenario: Selecting a provider the resolution excludes is rejected
- **WHEN** the resolved availability set for the customer's ZIP does not contain a given provider
- **AND** the customer's request attempts to finalize that provider or one of its plans
- **THEN** the finalize action SHALL reject the selection as not available for the ZIP.
