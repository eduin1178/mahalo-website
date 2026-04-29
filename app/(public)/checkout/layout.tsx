import type { ReactNode } from "react";

import { CheckoutStepper } from "@/components/checkout/stepper";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <CheckoutStepper />
      <div>{children}</div>
    </div>
  );
}
