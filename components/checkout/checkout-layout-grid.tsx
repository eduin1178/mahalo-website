"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// On the Plan step the order-total panel is hidden, so the content should span
// the full width instead of leaving the 320px summary column empty.
const FULL_WIDTH_PATHS = new Set<string>(["/checkout/plan"]);

export function CheckoutLayoutGrid({
  children,
  panel,
}: {
  children: ReactNode;
  panel: ReactNode;
}) {
  const pathname = usePathname();
  const fullWidth = pathname ? FULL_WIDTH_PATHS.has(pathname) : false;

  if (fullWidth) {
    return <div className="pb-24 lg:pb-0">{children}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="pb-24 lg:pb-0">{children}</div>
      {panel}
    </div>
  );
}
