/**
 * Single source of truth for legal/business identity used across the Privacy
 * Policy, Terms of Service, and contact disclosures.
 *
 * Values are client-confirmed. When the business identity changes, update it
 * here and bump LEGAL_LAST_UPDATED so the legal pages reflect the revision.
 */
export const COMPANY = {
	/** Public-facing brand name. */
	name: "Mahalo Enterprise",
	/** Registered legal entity name. */
	legalName: "Mahalo Enterprise",
	siteName: "www.mahaloenterprise.com",
	siteUrl: "https://www.mahaloenterprise.com",
	/** Monitored support inbox. */
	email: "mahaloenterprise1@gmail.com",
	/** Business phone number. */
	phone: "+1 (551)-331-6440",
	/** Business mailing address. */
	address: {
		line1: "7717 Newkirk Ave",
		city: "North Bergen",
		state: "NJ",
		zip: "07047",
	},
	/** Governing-law jurisdiction for the Terms of Service. */
	governingState: "New Jersey",
} as const;

/** Shown as the "Last Updated" date on the legal pages. Bump when copy changes. */
export const LEGAL_LAST_UPDATED = "May 30, 2026";
