import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

import { publicNavItems } from "./nav-config";
import { SiteMobileNav } from "./site-mobile-nav";
import { SiteHeaderScrollWrapper } from "./site-header-scroll-wrapper";

/**
 * SiteHeader
 *
 * Renders inside SiteHeaderScrollWrapper which sets data-scrolled="true|false"
 * on the wrapper div. The header reads that attribute via the
 * `[data-scrolled="false"]` CSS sibling selector built into the class names
 * below so CSS does the visual work — no layout shift.
 *
 * data-scrolled="false" → transparent background, light text (over navy hero)
 * data-scrolled="true"  → default solid bg-background/85 with dark text
 *
 * Both states meet WCAG AA:
 * - Light text on navy-900 (#0b1f4d): white > 12:1, white/80 ≈ 9:1
 * - Dark text on white bg: muted-foreground (#5b6b85) on white ≈ 4.7:1
 */
export function SiteHeader() {
  return (
    <SiteHeaderScrollWrapper>
      <header
        className={[
          "sticky top-0 z-40 w-full transition-colors duration-300",
          // Solid state (default / scrolled)
          "border-b border-border/60 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70",
          // Transparent state when data-scrolled="false" on the wrapper
          "[div[data-scrolled='false']_&]:border-transparent",
          "[div[data-scrolled='false']_&]:bg-transparent",
          "[div[data-scrolled='false']_&]:backdrop-blur-none",
          "[div[data-scrolled='false']_&]:supports-backdrop-filter:bg-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center" aria-label="Mahalo Enterprise — home">
            <Logo width={120} height={40} priority />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm font-medium transition-colors hover:text-mahalo-blue-600",
                  // Default: muted dark text
                  "text-muted-foreground",
                  // Transparent state: light text over navy hero
                  "[div[data-scrolled='false']_&]:text-white/80 [div[data-scrolled='false']_&]:hover:text-white",
                ].join(" ")}
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
    </SiteHeaderScrollWrapper>
  );
}
