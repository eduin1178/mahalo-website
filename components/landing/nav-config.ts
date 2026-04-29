export type PublicNavItem = {
  label: string;
  href: string;
};

export const publicNavItems: PublicNavItem[] = [
  { label: "Why us", href: "/#why" },
  { label: "Providers", href: "/#providers" },
  { label: "How it works", href: "/#how" },
  { label: "FAQ", href: "/#faq" },
  { label: "Testimonials", href: "/#testimonials" },
];

export const publicFooterLinks: PublicNavItem[] = [
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Contact", href: "mailto:hello@mahaloenterprise.com" },
];
