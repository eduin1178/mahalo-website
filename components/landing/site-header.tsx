import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

import { publicNavItems } from "./nav-config";
import { SiteMobileNav } from "./site-mobile-nav";

/**
 * SiteHeader
 *
 * Solid public navbar. The logo asset has a white visual field, so the header
 * owns the matching white surface instead of styling the logo itself. That
 * keeps the logo clean and avoids the awkward white patch during scroll.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-white shadow-[0_8px_30px_rgba(11,31,77,0.06)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center" aria-label="Mahalo Enterprise - home">
          <Logo width={120} height={40} priority />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-mahalo-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="hidden md:inline-flex"
            render={<Link href="/#hero" />}
          >
            Check Availability
          </Button>
          <SiteMobileNav />
        </div>
      </div>
    </header>
  );
}
