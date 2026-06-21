/**
 * Single source of truth for the checkout consent disclaimer shown next to the
 * "Confirm order" control in the final checkout phase.
 *
 * The consent is transactional: it records acceptance of the Terms of Service
 * and Privacy Policy AND authorizes contact required to process, verify, and
 * activate the order (an agent calls to verify identity before activation). It
 * is NOT a marketing opt-in, which is why it can gate the purchase.
 *
 * When this wording changes, bump CONSENT_VERSION so the value stamped onto each
 * order (`orders.termsVersion`) stays auditable against the accepted copy.
 */

/** Version identifier stamped onto an order when its consent is accepted. */
export const CONSENT_VERSION = "2026-05-31";

/**
 * Disclaimer copy broken into segments so the UI can render inline links to the
 * legal pages without duplicating the prose. Keep CONSENT_TEXT in sync.
 */
export const CONSENT_COPY = {
  before: "By placing this order, I agree to the",
  termsLabel: "Terms of Service",
  termsHref: "/legal/terms",
  and: "and",
  privacyLabel: "Privacy Policy",
  privacyHref: "/legal/privacy",
  after:
    ", and I authorize Mahalo Enterprise and its authorized partners to contact me by phone, text message, prerecorded message, and email — including with automated technology — at the number and email I provided, in order to process, verify, and activate this order. Checking this box constitutes my electronic signature.",
} as const;

/** Flat plain-text rendering of the disclaimer, for audit and logging. */
export const CONSENT_TEXT = `${CONSENT_COPY.before} ${CONSENT_COPY.termsLabel} ${CONSENT_COPY.and} ${CONSENT_COPY.privacyLabel}${CONSENT_COPY.after}`;

/**
 * Marketing / automated-technology contact disclaimer shown as a MANDATORY modal
 * gating the plan-or-customize advance action. This is distinct from CONSENT_COPY
 * above (the transactional consent on the final step). Clicking the modal's
 * "Continue" button constitutes the user's electronic signature — there is no
 * separate checkbox. The provider name is interpolated into the modal heading.
 */
export const PROVIDER_DISCLAIMER_PARAGRAPHS = [
  "By clicking the button or entering your information, you consent for Mahalo Enterprise, and any of its affiliate service providers to use automated technology. Including but not limited to: texts, phone calls, prerecorded messages, email or digital technology to contact you at the number and email provided about Mahalo Enterprise offers which may or may not be directly related to this specific marketing campaign using other affiliate companies.",
  "This consent is not required to make a purchase. Clicking the button below constitutes your electronic signature.",
] as const;

/** Heading for the disclaimer modal, e.g. "Optimum disclaimer". */
export function providerDisclaimerHeading(providerName: string): string {
  return `${providerName} disclaimer`;
}
