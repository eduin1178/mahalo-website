import type { ReactNode } from "react";

import { CheckoutStepper } from "@/components/checkout/stepper";
import { OrderTotalPanel } from "@/components/checkout/order-total-panel";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <CheckoutStepper />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="pb-24 lg:pb-0">{children}</div>
        <OrderTotalPanel />
      </div>
    </div>
  );
}
