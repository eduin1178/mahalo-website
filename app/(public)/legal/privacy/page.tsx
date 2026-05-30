import {
  LegalList,
  LegalSection,
  LegalShell,
  LegalText,
} from "@/components/legal/legal-shell";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${COMPANY.name} collects, uses, and protects your information.`,
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <LegalText>
        {COMPANY.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
        respects your privacy and is committed to protecting your personal
        information. This Privacy Policy explains how we collect, use, disclose,
        and safeguard your information when you visit {COMPANY.siteName} (the
        &ldquo;Site&rdquo;). We adopt this policy to comply with applicable
        privacy laws, including the California Online Privacy Protection Act
        (CalOPPA), the California Consumer Privacy Act and California Privacy
        Rights Act (CCPA/CPRA), the General Data Protection Regulation (GDPR),
        the Personal Information Protection and Electronic Documents Act
        (PIPEDA), and similar regulations.
      </LegalText>
      <LegalText>
        {COMPANY.name} operates as an authorized reseller and marketing partner
        for internet and connectivity programs offered by third-party service
        providers. We do not provide internet service directly. By accessing or
        using the Site, you agree to this Privacy Policy. Please also review our
        Terms of Service. If you do not agree, please do not use the Site.
      </LegalText>

      <LegalSection heading="1. Information We Collect">
        <LegalText>
          We collect personal information that you voluntarily provide when you
          fill out forms, contact us, or place an order, including:
        </LegalText>
        <LegalList>
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Service and billing address</li>
          <li>
            Payment information (credit/debit card or bank account/ACH details)
            when you choose to enroll in automatic payments (autopay) during
            checkout
          </li>
        </LegalList>
        <LegalText>
          We may also automatically collect certain non-personal information
          through cookies and similar technologies, such as browser type,
          device type, IP address, and pages visited and interaction data.
        </LegalText>
      </LegalSection>

      <LegalSection heading="2. How We Use Your Information">
        <LegalText>We use your information to:</LegalText>
        <LegalList>
          <li>Respond to inquiries and service requests</li>
          <li>
            Validate service addresses (including through the U.S. Postal Service
            address API) and determine plan availability
          </li>
          <li>
            Connect you with third-party telecommunications and connectivity
            service providers and facilitate referrals, eligibility review, and
            enrollment
          </li>
          <li>Process and schedule installation of the services you request</li>
          <li>Communicate regarding services, updates, and next steps</li>
          <li>Improve website performance, functionality, and user experience</li>
          <li>Support marketing, advertising, and remarketing efforts</li>
        </LegalList>
        <LegalText>
          {COMPANY.name} acts as a marketing and referral partner. All final
          service qualification, account setup, billing, and service delivery
          are handled by the third-party provider through their own
          provider-approved systems. We do not sell or share your personal
          information for monetary consideration or cross-context behavioral
          advertising as defined under applicable law.
        </LegalText>
      </LegalSection>

      <LegalSection heading="3. Communications &amp; Consent">
        <LegalText>
          By submitting your information on this Site, you provide express
          written consent to be contacted by {COMPANY.name} and its authorized
          partners. This contact may include phone calls (including automated or
          prerecorded calls), text messages (SMS/MMS), and emails at the number
          and email address you provide. This consent is not a condition of any
          purchase. You may opt out of marketing emails at any time by using the
          &ldquo;unsubscribe&rdquo; link, and you may opt out of text messages by
          replying &ldquo;STOP.&rdquo;
        </LegalText>
      </LegalSection>

      <LegalSection heading="4. Cookies &amp; Tracking Technologies">
        <LegalText>
          We use cookies, pixels, tags, and similar technologies to analyze
          website traffic and usage patterns, improve functionality and user
          experience, and support advertising and remarketing campaigns.
          Third-party analytics and advertising platforms&mdash;including Google
          (Google Analytics and Google Ads) and Meta (the Meta
          Pixel)&mdash;may also set cookies or use tracking technologies to
          measure performance and deliver personalized or remarketing ads.
        </LegalText>
        <LegalText>
          You can control or disable cookies through your browser settings;
          however, some features of the Site may not function properly if
          disabled. You may also opt out of interest-based advertising through
          the Network Advertising Initiative
          (optout.networkadvertising.org), the Digital Advertising Alliance
          (optout.aboutads.info), your Google Ads Settings, and your Meta ad
          preferences. We disclose how we respond to &ldquo;Do Not Track&rdquo;
          signals in accordance with applicable law.
        </LegalText>
      </LegalSection>

      <LegalSection heading="5. How We Share Information">
        <LegalText>We may share your personal information with:</LegalText>
        <LegalList>
          <li>
            Third-party internet and connectivity service providers, to fulfill
            your request and facilitate service qualification and enrollment
          </li>
          <li>
            Vendors and service providers that support our operations, such as
            address validation (USPS), email delivery (Resend), workflow
            automation (n8n), cloud file and asset storage (Cloudflare R2), and
            staff authentication (Clerk)
          </li>
          <li>
            Advertising and analytics partners (such as Google and Meta) that
            help us measure and deliver advertising
          </li>
          <li>
            Legal authorities when required to comply with applicable laws or
            regulations
          </li>
        </LegalList>
        <LegalText>
          We do not share personal information with third parties for their own
          independent marketing purposes without your consent.
        </LegalText>
      </LegalSection>

      <LegalSection heading="6. Do Not Sell or Share My Personal Information">
        <LegalText>
          {COMPANY.name} does not sell your personal information for monetary
          value, and we do not share it for cross-context behavioral advertising
          as those terms are defined under the CCPA/CPRA. If our practices
          change, we will update this policy and provide a clear opt-out
          mechanism. California residents may exercise their right to opt out by
          contacting us using the details in the &ldquo;Contact Us&rdquo;
          section below.
        </LegalText>
      </LegalSection>

      <LegalSection heading="7. International Transfers">
        <LegalText>
          If you access the Site from outside the United States, your
          information may be transferred to and processed in the United States or
          other jurisdictions. By using the Site, you consent to such transfers.
        </LegalText>
      </LegalSection>

      <LegalSection heading="8. Your Privacy Rights">
        <LegalText>
          Depending on your location, you may have the right to request access
          to, correction of, or deletion of your personal information; to opt out
          of the sale or sharing of personal information (note: we do not sell or
          share as defined by law); and to limit the use of sensitive personal
          information. To exercise your rights, please contact us using the
          information below. We will not discriminate against you for exercising
          any of these rights.
        </LegalText>
      </LegalSection>

      <LegalSection heading="9. Data Retention">
        <LegalText>
          We retain personal information only for as long as necessary to fulfill
          the purposes outlined in this policy, comply with legal obligations,
          and resolve disputes.
        </LegalText>
      </LegalSection>

      <LegalSection heading="10. Data Security">
        <LegalText>
          We implement administrative, technical, and physical safeguards
          designed to protect your personal information. However, no system can
          guarantee complete security.
        </LegalText>
      </LegalSection>

      <LegalSection heading="11. Children&rsquo;s Privacy">
        <LegalText>
          This Site is not directed to individuals under the age of 13, and we
          do not knowingly collect personal information from children. If you
          believe a child has provided us personal information, please contact
          us and we will delete it.
        </LegalText>
      </LegalSection>

      <LegalSection heading="12. Changes to This Policy">
        <LegalText>
          We may update this Privacy Policy from time to time. The &ldquo;Last
          Updated&rdquo; date reflects the most recent changes. Continued use of
          the Site constitutes acceptance of those changes.
        </LegalText>
      </LegalSection>

      <LegalSection heading="13. Contact Us">
        <LegalText>
          If you have questions or would like to exercise your privacy rights,
          please contact:
        </LegalText>
        <LegalList>
          <li>{COMPANY.legalName}</li>
          <li>Email: {COMPANY.email}</li>
          <li>Phone: {COMPANY.phone}</li>
          <li>
            Address: {COMPANY.address.line1}, {COMPANY.address.city},{" "}
            {COMPANY.address.state} {COMPANY.address.zip}
          </li>
        </LegalList>
      </LegalSection>
    </LegalShell>
  );
}
