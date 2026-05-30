import {
  LegalList,
  LegalSection,
  LegalShell,
  LegalText,
} from "@/components/legal/legal-shell";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/legal/company";

export const metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of the ${COMPANY.name} website.`,
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED}>
      <LegalText>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of {COMPANY.siteName} (the &ldquo;Site&rdquo;) operated by{" "}
        {COMPANY.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
        By accessing or using the Site, you agree to be bound by these Terms and
        by our Privacy Policy. If you do not agree, please do not use the Site.
      </LegalText>

      <LegalSection heading="1. Authorized Reseller; No Direct Service">
        <LegalText>
          {COMPANY.name} is an authorized reseller and marketing partner for
          internet and connectivity programs offered by independent third-party
          service providers. We do not own, operate, or provide internet service
          directly, and we do not process or complete service orders ourselves.
          All service qualification, account creation, billing, installation,
          and service delivery are performed by the applicable third-party
          provider under their own terms and conditions.
        </LegalText>
      </LegalSection>

      <LegalSection heading="2. Eligibility and Use of the Site">
        <LegalText>
          You must be at least 18 years old and able to form a binding contract
          to use the Site. You agree to provide accurate, current, and complete
          information and to use the Site only for lawful purposes and in
          accordance with these Terms.
        </LegalText>
      </LegalSection>

      <LegalSection heading="3. Order Process">
        <LegalText>
          The Site lets you check service availability and request service
          through the following steps:
        </LegalText>
        <LegalList>
          <li>
            You enter a ZIP code or address, which we validate to determine which
            providers and plans may be available at your location
          </li>
          <li>You select a plan and any optional add-ons</li>
          <li>
            You provide your contact information, installation address, and
            billing address
          </li>
          <li>You schedule an installation date and time</li>
          <li>You submit your request for processing by the provider</li>
        </LegalList>
        <LegalText>
          Submitting a request does not guarantee service. All requests are
          subject to provider serviceability, credit approval, and final
          qualification by the third-party provider.
        </LegalText>
      </LegalSection>

      <LegalSection heading="4. Payment and Autopay Authorization">
        <LegalText>
          If you choose to enroll in automatic payments (autopay), you authorize
          the applicable provider to store and charge the payment method you
          provide (credit/debit card or bank account/ACH) on a recurring basis
          in accordance with the plan you select. Billing is handled by the
          third-party provider. You are responsible for keeping your payment
          information accurate and up to date and may change your payment
          preferences through the provider.
        </LegalText>
      </LegalSection>

      <LegalSection heading="5. Pricing and Availability">
        <LegalText>
          Prices, speeds, and promotions displayed on the Site are indicative,
          may vary by address and provider availability, and are subject to
          change at any time without notice. Final pricing, terms, taxes, fees,
          and surcharges are determined by the third-party provider at the time
          of enrollment. Offers may not be available in all areas.
        </LegalText>
      </LegalSection>

      <LegalSection heading="6. Third-Party Providers and Services">
        <LegalText>
          Your relationship for internet service is with the third-party
          provider, not with {COMPANY.name}. The provider&rsquo;s terms,
          conditions, and privacy practices govern the service you receive. We
          are not responsible for the acts, omissions, products, or services of
          any third-party provider.
        </LegalText>
      </LegalSection>

      <LegalSection heading="7. Intellectual Property">
        <LegalText>
          The Site and its content, including text, graphics, logos, and
          software, are owned by or licensed to {COMPANY.name} and are protected
          by applicable intellectual property laws. Provider names and logos are
          the property of their respective owners and are used with
          authorization. You may not copy, reproduce, or create derivative works
          from the Site without our prior written permission.
        </LegalText>
      </LegalSection>

      <LegalSection heading="8. Disclaimers">
        <LegalText>
          The Site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          without warranties of any kind, whether express or implied, including
          warranties of merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Site will be
          uninterrupted, error-free, or free of harmful components, or that any
          plan, price, or availability information is complete or accurate.
        </LegalText>
      </LegalSection>

      <LegalSection heading="9. Limitation of Liability">
        <LegalText>
          To the maximum extent permitted by law, {COMPANY.name} and its
          affiliates will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits or
          revenues, arising out of or related to your use of the Site or any
          service obtained through a third-party provider, even if advised of the
          possibility of such damages.
        </LegalText>
      </LegalSection>

      <LegalSection heading="10. Indemnification">
        <LegalText>
          You agree to indemnify and hold harmless {COMPANY.name} and its
          affiliates from any claims, damages, liabilities, and expenses arising
          out of your use of the Site or your violation of these Terms.
        </LegalText>
      </LegalSection>

      <LegalSection heading="11. Governing Law">
        <LegalText>
          These Terms are governed by the laws of the State of{" "}
          {COMPANY.governingState}, without regard to its conflict-of-law
          principles. Any dispute arising under these Terms will be subject to
          the exclusive jurisdiction of the state and federal courts located in
          that state.
        </LegalText>
      </LegalSection>

      <LegalSection heading="12. Changes to These Terms">
        <LegalText>
          We may update these Terms from time to time. The &ldquo;Last
          Updated&rdquo; date reflects the most recent changes. Your continued
          use of the Site after changes are posted constitutes acceptance of the
          updated Terms.
        </LegalText>
      </LegalSection>

      <LegalSection heading="13. Contact Us">
        <LegalText>If you have questions about these Terms, contact:</LegalText>
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
