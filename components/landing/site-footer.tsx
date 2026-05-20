import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

import { publicFooterLinks } from "./nav-config";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo width={130} height={38} />
          <p className="text-sm text-muted-foreground">
            Internet & TV providers, all in one place.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
          {publicFooterLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-mahalo-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground">
          © {year} Mahalo Enterprise. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
