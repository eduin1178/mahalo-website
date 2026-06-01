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
