## ADDED Requirements

### Requirement: Privacy Policy page is complete, accurate, and ad-platform compliant

The `/legal/privacy` route SHALL render a complete Privacy Policy in US English that accurately describes Mahalo's data practices and satisfies the disclosure requirements of major advertising platforms (Google Ads, Meta). It SHALL NOT contain placeholder or "client-provided" filler text, and SHALL NOT assert practices that contradict the system's behavior.

#### Scenario: Privacy Policy renders real content

- **WHEN** a visitor loads `/legal/privacy`
- **THEN** the page renders a server-rendered article with an `<h1>` "Privacy Policy" and a visible "Last Updated" date
- **AND** no placeholder text (e.g., "TODO", "Placeholder", "provided by client") appears anywhere on the page
- **AND** all copy is in US English

#### Scenario: Disclosures match actual data practices

- **WHEN** the Privacy Policy describes the information collected
- **THEN** it discloses that payment information (card or bank/ACH details) is collected when a customer enrolls in autopay during checkout
- **AND** it discloses use of third-party processors and partners including internet service providers, address validation (USPS), email delivery (Resend), workflow automation (n8n), file/asset storage (Cloudflare R2), and authentication for staff (Clerk)
- **AND** it does NOT claim that payment information is never collected

#### Scenario: Advertising and tracking disclosures are present

- **WHEN** a visitor reads the Privacy Policy
- **THEN** it contains a Cookies & Tracking Technologies section disclosing cookies, pixels, analytics, and advertising/remarketing technologies (including Google and Meta)
- **AND** it discloses sharing of data with advertising partners and describes opt-out mechanisms
- **AND** it contains a "Do Not Sell or Share My Personal Information" disclosure addressing CCPA/CPRA
- **AND** it contains a Children's Privacy section stating the site is not directed to children under 13
- **AND** it contains a business-identity Contact section with the dealer's name, email, phone, and mailing address

### Requirement: Terms of Service page reflects the checkout functionality

The `/legal/terms` route SHALL render complete Terms of Service in US English derived from the actual checkout-wizard functionality and standard reseller-industry terms. It SHALL NOT contain placeholder text.

#### Scenario: Terms render real content

- **WHEN** a visitor loads `/legal/terms`
- **THEN** the page renders a server-rendered article with an `<h1>` "Terms of Service" and a visible "Last Updated" date
- **AND** no placeholder text appears anywhere on the page

#### Scenario: Terms cover reseller relationship and order process

- **WHEN** a visitor reads the Terms of Service
- **THEN** it states that Mahalo operates as an authorized reseller and does not provide internet service directly
- **AND** it describes the order process (address/ZIP lookup, plan selection, customer information, installation scheduling) and payment/autopay authorization
- **AND** it states that displayed pricing is indicative and varies by address and provider availability
- **AND** it includes third-party provider terms, disclaimers, limitation of liability, governing law, and a changes-to-terms clause

### Requirement: Legal pages are reachable from the public site

The Privacy Policy and Terms of Service SHALL be reachable from the public site footer.

#### Scenario: Footer links resolve to the legal pages

- **WHEN** a visitor views the public site footer
- **THEN** a "Privacy" link navigates to `/legal/privacy`
- **AND** a "Terms" link navigates to `/legal/terms`
- **AND** both pages return HTTP 200
