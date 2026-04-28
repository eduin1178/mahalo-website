"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { changeOrderStatus } from "@/lib/orders/actions";
import { orderStatusValues, type OrderStatus } from "@/lib/db/schema";

export function StatusChanger({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await changeOrderStatus(formData);
      if (!res.ok) {
        setError(res.error);
      } else {
        setNotes("");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-mahalo-navy-900">
          <span>New status</span>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {orderStatusValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-mahalo-navy-900 md:col-span-2">
          <span>Notes (optional)</span>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={2000}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Internal note for the timeline"
          />
        </label>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="submit"
        variant="solid"
        size="sm"
        disabled={isPending || status === currentStatus}
      >
        {isPending ? "Saving…" : "Update status"}
      </Button>
    </form>
  );
}
