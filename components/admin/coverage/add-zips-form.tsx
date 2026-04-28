"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addZips } from "@/lib/coverage/actions";

type Props = { providerId: string };

export function AddZipsForm({ providerId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    setSuccess(null);
    formData.set("providerId", providerId);
    startTransition(async () => {
      const result = await addZips(formData);
      if (!result.ok) {
        setError(
          result.fieldErrors?.zips?.[0] ?? result.error ?? "Failed to add ZIPs",
        );
        return;
      }
      const { added, skipped } = result.data;
      setSuccess(
        `Added ${added} ZIP${added === 1 ? "" : "s"}` +
          (skipped > 0 ? ` (${skipped} already assigned)` : ""),
      );
      const formEl = document.getElementById(
        "add-zips-form",
      ) as HTMLFormElement | null;
      formEl?.reset();
      router.refresh();
    });
  }

  return (
    <form id="add-zips-form" action={action} className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="zips">Add ZIP codes</Label>
        <textarea
          id="zips"
          name="zips"
          rows={6}
          required
          placeholder={"33101\n33102, 33103\n33104"}
          className="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          One per line, or separated by commas/spaces. 5 digits each.
        </p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {success ? (
          <p className="text-xs text-emerald-600">{success}</p>
        ) : null}
      </div>
      <Button type="submit" variant="solid" disabled={pending}>
        {pending ? "Adding…" : "Add ZIPs"}
      </Button>
    </form>
  );
}
