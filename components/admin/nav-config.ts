import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  Cog,
  Layers,
  MapPinned,
  PackagePlus,
  Users,
} from "lucide-react";

import type { AppRole } from "@/lib/clerk/require-role";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If true, only role `admin` can see this entry. Otherwise visible to admin + agent. */
  adminOnly: boolean;
};

export const ADMIN_NAV: NavItem[] = [
  { label: "Providers", href: "/admin/providers", icon: Building2, adminOnly: true },
  { label: "Plans", href: "/admin/plans", icon: Layers, adminOnly: true },
  { label: "Add-ons", href: "/admin/add-ons", icon: PackagePlus, adminOnly: true },
  { label: "Coverage", href: "/admin/coverage", icon: MapPinned, adminOnly: true },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList, adminOnly: false },
  { label: "Customers", href: "/admin/customers", icon: Users, adminOnly: false },
  { label: "Settings", href: "/admin/settings", icon: Cog, adminOnly: true },
];

export function visibleNavFor(role: AppRole | null): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "agent") return ADMIN_NAV.filter((item) => !item.adminOnly);
  return [];
}
