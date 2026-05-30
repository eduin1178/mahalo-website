/**
 * Single source of truth for legal/business identity used across the Privacy
 * Policy, Terms of Service, and contact disclosures.
 *
 * LAUNCH-BLOCKING TODO: replace every value marked `TODO` with the real,
 * client-confirmed business identity before the site goes public. A privacy
 * policy that cites CCPA/CPRA with placeholder contact details is not
 * compliant.
 */
export const COMPANY = {
	/** Public-facing brand name. */
	name: "Mahalo Enterprise",
	/** TODO: confirm the registered legal entity name if it differs from the brand. */
	legalName: "Mahalo Enterprise",
	siteName: "www.mahaloenterprise.com",
	siteUrl: "https://www.mahaloenterprise.com",
	/** TODO: confirm the monitored support inbox. */
	email: "mahaloenterprise1@gmail.com",
	/** TODO: real business phone number. */
	phone: "+1 (551)-331-6440",
	address: {
		line1: "3808 Bowfin Trl",
		city: "Kissimmee",
		state: "FL",
		zip: "34746",
	},
	/** TODO: confirm the governing-law jurisdiction (dealer's operating state). */
	governingState: "Oklahoma",
} as const;

/** Shown as the "Last Updated" date on the legal pages. Bump when copy changes. */
export const LEGAL_LAST_UPDATED = "May 30, 2026";
