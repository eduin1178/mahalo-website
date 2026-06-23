"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateProvider } from "@/lib/providers/actions";

type Props = {
  id: string;
  initialName: string;
  initialColor: string;
  initialFallback: boolean;
};

export function ProviderEditForm({
  id,
  initialName,
  initialColor,
  initialFallback,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function action(formData: FormData) {
    setErrors(null);
    setMessage(null);
    formData.set("id", id);
    startTransition(async () => {
      const result = await updateProvider(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? null);
        setMessage(result.error);
        return;
      }
      setMessage("Saved.");
      router.refresh();
    });
  }

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="ep-name">Name</Label>
        <Input
          id="ep-name"
          name="name"
          defaultValue={initialName}
          required
          maxLength={120}
        />
        {errors?.name?.[0] ? (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ep-color">Primary color</Label>
        <div className="flex items-center gap-3">
          <span
            className="inline-block size-8 rounded border"
            style={{ backgroundColor: initialColor }}
            aria-hidden
          />
          <Input
            id="ep-color"
            name="primaryColor"
            defaultValue={initialColor}
            pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"
            required
            className="font-mono"
          />
        </div>
        {errors?.primaryColor?.[0] ? (
          <p className="text-xs text-destructive">{errors.primaryColor[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label htmlFor="ep-fallback" className="flex items-start gap-3">
          <input
            id="ep-fallback"
            name="isFallback"
            type="checkbox"
            defaultChecked={initialFallback}
            className="mt-0.5 size-4 rounded border-input accent-mahalo-blue-600"
          />
          <span className="grid gap-0.5">
            <span className="text-sm font-medium leading-none">
              Fallback provider
            </span>
            <span className="text-xs text-muted-foreground">
              Shown only when no other provider covers the ZIP. Offered in every
              area regardless of coverage.
            </span>
          </span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {message ? (
          <span
            className={
              errors
                ? "text-sm text-destructive"
                : "text-sm text-mahalo-blue-600"
            }
          >
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
