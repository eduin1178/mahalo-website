"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  Cog,
  Layers,
  Mail,
  MapPinned,
  PackagePlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { NavIconKey, NavItem } from "./nav-config";

const ICONS: Record<NavIconKey, LucideIcon> = {
  providers: Building2,
  plans: Layers,
  addOns: PackagePlus,
  coverage: MapPinned,
  orders: ClipboardList,
  customers: Users,
  messages: Mail,
  settings: Cog,
};

type SidebarNavProps = {
  items: NavItem[];
  onNavigate?: () => void;
};

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-mahalo-navy-900 text-white"
                : "text-mahalo-navy-900 hover:bg-surface",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span
                className={cn(
                  "ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-mahalo-blue-600 text-white",
                )}
                aria-label={`${item.badge} new`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
