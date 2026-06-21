## ADDED Requirements

### Requirement: Hero provider strip SHALL source logos from the provider data source with a uniform name fallback

The hero's "Authorized Reseller" provider strip SHALL render the active providers from the provider data source (`listProviders()`), not a hardcoded list. For each provider, the strip SHALL display the provider's `logoUrl` image when present; when `logoUrl` is absent it SHALL fall back to the provider name rendered in a **single uniform text style** (no per-provider italic or weight variation). The hardcoded wordmark list SHALL be removed.

#### Scenario: Provider has a logo
- **WHEN** the hero strip renders a provider whose `logoUrl` is set
- **THEN** it SHALL display the logo image as that provider's identity in the strip.

#### Scenario: Provider has no logo
- **WHEN** the hero strip renders a provider whose `logoUrl` is null
- **THEN** it SHALL display the provider name as text
- **AND** the name SHALL use the same uniform text style as every other name fallback in the strip (no mixed italic/non-italic or weight variation).

#### Scenario: Strip reads from the active provider catalog
- **WHEN** the hero renders
- **THEN** the strip SHALL list only active providers obtained from `listProviders()`
- **AND** SHALL NOT render any hardcoded provider wordmarks.

#### Scenario: No active providers
- **WHEN** there are no active providers
- **THEN** the hero SHALL omit the provider strip rather than render placeholder wordmarks.
