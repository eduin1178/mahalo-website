import type { ReactNode } from "react";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
