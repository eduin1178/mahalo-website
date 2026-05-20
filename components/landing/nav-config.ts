export type PublicNavItem = {
  label: string;
  href: string;
};

export const publicNavItems: PublicNavItem[] = [
  { label: "How it works", href: "/#how" },
  { label: "Providers", href: "/#providers" },
  { label: "Why us", href: "/#why" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "FAQ", href: "/#faq" },
];

export const publicFooterLinks: PublicNavItem[] = [
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Contact", href: "mailto:hello@mahaloenterprise.com" },
];
