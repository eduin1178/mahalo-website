import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

import { publicNavItems } from "./nav-config";
import { SiteMobileNav } from "./site-mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center" aria-label="Mahalo Enterprise — home">
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
