import type { ReactNode } from "react";

import { CheckoutStepper } from "@/components/checkout/stepper";
import { CheckoutLayoutGrid } from "@/components/checkout/checkout-layout-grid";
import { OrderTotalPanel } from "@/components/checkout/order-total-panel";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <CheckoutStepper />
      <CheckoutLayoutGrid panel={<OrderTotalPanel />}>
        {children}
      </CheckoutLayoutGrid>
    </div>
  );
}
