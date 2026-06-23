"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createProvider } from "@/lib/providers/actions";

export function NewProviderDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setErrors(null);
    setGeneralError(null);
    startTransition(async () => {
      const result = await createProvider(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? null);
        setGeneralError(result.error);
        return;
      }
      setOpen(false);
      router.push(`/admin/providers/${result.data.id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="solid">New provider</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New provider</DialogTitle>
          <DialogDescription>
            Create a carrier. You can upload its logo afterwards.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="np-name">Name</Label>
            <Input id="np-name" name="name" required maxLength={120} autoFocus />
            {errors?.name?.[0] ? (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="np-color">Primary color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="np-color"
                name="primaryColor"
                placeholder="#0B1F4D"
                required
                pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"
                className="font-mono"
              />
            </div>
            {errors?.primaryColor?.[0] ? (
              <p className="text-xs text-destructive">{errors.primaryColor[0]}</p>
            ) : null}
          </div>
          <input type="hidden" name="isActive" value="true" />
          <label htmlFor="np-fallback" className="flex items-start gap-3">
            <input
              id="np-fallback"
              name="isFallback"
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input accent-mahalo-blue-600"
            />
            <span className="grid gap-0.5">
              <span className="text-sm font-medium leading-none">
                Fallback provider
              </span>
              <span className="text-xs text-muted-foreground">
                Shown only when no other provider covers the ZIP.
              </span>
            </span>
          </label>
          {generalError && !errors ? (
            <p className="text-sm text-destructive">{generalError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="solid" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
