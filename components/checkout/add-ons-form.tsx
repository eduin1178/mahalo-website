"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { selectAddOns } from "@/lib/orders/draft-actions";
import type { AddOn } from "@/lib/db/schema";

type Props = {
  addOns: AddOn[];
  primaryColor: string;
  initialSelected: string[];
};

export function AddOnsForm({ addOns, primaryColor, initialSelected }: Props) {
  const initial = useMemo(() => new Set(initialSelected), [initialSelected]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(ids: string[]) {
    setError(null);
    startTransition(async () => {
      const result = await selectAddOns({ addOnIds: ids });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {addOns.map((addOn) => {
          const checked = selected.has(addOn.id);
          const price = Number(addOn.price).toFixed(2);
          return (
            <li key={addOn.id}>
              <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:bg-surface"
                style={
                  checked
                    ? { borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` }
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 cursor-pointer accent-mahalo-blue-600"
                  checked={checked}
                  onChange={() => toggle(addOn.id)}
                  disabled={pending}
                />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-mahalo-navy-900">
                      {addOn.name}
                    </span>
                    <span className="text-sm font-semibold text-mahalo-navy-900">
                      ${price}
                      <span className="text-xs font-normal text-muted-foreground">
                        /mo
                      </span>
                    </span>
                  </div>
                  {addOn.description ? (
                    <p className="text-xs text-muted-foreground">
                      {addOn.description}
                    </p>
                  ) : null}
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => submit([])}
        >
          Skip
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={() => submit(Array.from(selected))}
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
