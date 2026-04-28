"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rescheduleOrder } from "@/lib/orders/actions";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const tzOffset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function RescheduleForm({
  orderId,
  currentScheduledAt,
}: {
  orderId: string;
  currentScheduledAt: Date | null;
}) {
  const [value, setValue] = useState<string>(toLocalInput(currentScheduledAt));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await rescheduleOrder(formData);
      if (!res.ok) {
        setError(res.error);
      } else {
        setSuccess("Schedule updated.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="space-y-1 text-xs font-medium text-mahalo-navy-900">
        <span>Installation date &amp; time</span>
        <Input
          type="datetime-local"
          name="scheduledAt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          step={3600}
          required
          className="h-9 max-w-xs"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Mon–Sat, 8:00 AM – 5:00 PM, future dates only.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-success">{success}</p> : null}
      <Button type="submit" variant="solid" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : "Reschedule"}
      </Button>
    </form>
  );
}
