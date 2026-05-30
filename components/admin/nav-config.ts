import type { AppRole } from "@/lib/clerk/require-role";

export type NavIconKey =
  | "providers"
  | "plans"
  | "addOns"
  | "coverage"
  | "orders"
  | "customers"
  | "messages"
  | "settings";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconKey;
  /** If true, only role `admin` can see this entry. Otherwise visible to admin + agent. */
  adminOnly: boolean;
  /** Optional count rendered as a badge next to the label (e.g. unread messages). */
  badge?: number;
};

export const ADMIN_NAV: NavItem[] = [
  { label: "Providers", href: "/admin/providers", icon: "providers", adminOnly: true },
  { label: "Plans", href: "/admin/plans", icon: "plans", adminOnly: true },
  { label: "Add-ons", href: "/admin/add-ons", icon: "addOns", adminOnly: true },
  { label: "Coverage", href: "/admin/coverage", icon: "coverage", adminOnly: true },
  { label: "Orders", href: "/admin/orders", icon: "orders", adminOnly: false },
  { label: "Customers", href: "/admin/customers", icon: "customers", adminOnly: false },
  { label: "Messages", href: "/admin/messages", icon: "messages", adminOnly: false },
  { label: "Settings", href: "/admin/settings", icon: "settings", adminOnly: true },
];

export function visibleNavFor(role: AppRole | null): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "agent") return ADMIN_NAV.filter((item) => !item.adminOnly);
  return [];
}
