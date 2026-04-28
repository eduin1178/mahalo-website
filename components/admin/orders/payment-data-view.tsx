"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { PaymentData } from "@/lib/db/schema";

function maskAll(value: string, visibleTail = 4): string {
  if (!value) return "—";
  const tail = value.slice(-visibleTail);
  const head = "•".repeat(Math.max(0, value.length - visibleTail));
  return head + tail;
}

export function PaymentDataView({
  data,
  autopayEnabled,
}: {
  data: PaymentData | null;
  autopayEnabled: boolean;
}) {
  const [reveal, setReveal] = useState(false);

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        {autopayEnabled
          ? "Autopay enabled but no payment data captured."
          : "No payment data (autopay off)."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {data.type === "card" ? "Credit card" : "ACH"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setReveal((v) => !v)}
        >
          {reveal ? "Hide" : "Reveal"}
        </Button>
      </div>

      {data.type === "card" ? (
        <dl className="grid gap-2 text-sm">
          <Field label="Holder" value={data.holder} />
          <Field
            label="Number"
            value={reveal ? data.number : maskAll(data.number)}
          />
          <Field
            label="Expiration"
            value={reveal ? data.exp : maskAll(data.exp, 0)}
          />
          <Field label="CVV" value={reveal ? data.cvv : "•••"} />
        </dl>
      ) : (
        <dl className="grid gap-2 text-sm">
          <Field
            label="Routing"
            value={reveal ? data.routing : maskAll(data.routing)}
          />
          <Field
            label="Account"
            value={reveal ? data.account : maskAll(data.account)}
          />
          <Field label="Account type" value={data.accountType} />
        </dl>
      )}
      <p className="text-xs text-muted-foreground">
        Stored in plain text per requirement; PCI is the client&apos;s
        responsibility.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-mono text-sm text-mahalo-navy-900">{value}</dd>
    </div>
  );
}
