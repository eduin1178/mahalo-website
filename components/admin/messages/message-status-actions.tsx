"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateMessageStatus } from "@/lib/contact/admin-actions";
import type { ContactMessageStatus } from "@/lib/db/schema";

const TRANSITIONS: { label: string; to: ContactMessageStatus }[] = [
  { label: "Mark as new", to: "new" },
  { label: "Mark as read", to: "read" },
  { label: "Archive", to: "archived" },
];

export function MessageStatusActions({
  id,
  current,
}: {
  id: string;
  current: ContactMessageStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(to: ContactMessageStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateMessageStatus(id, to);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {TRANSITIONS.filter((t) => t.to !== current).map((t) => (
          <Button
            key={t.to}
            type="button"
            variant={t.to === "archived" ? "outline" : "default"}
            size="sm"
            disabled={pending}
            onClick={() => change(t.to)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
