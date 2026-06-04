"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { uploadProviderImage } from "@/lib/providers/actions";
import type { ProviderImageType } from "@/lib/providers/image-types";

const MAX_BYTES = 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function ProviderImageForm({
  id,
  imageType,
  label,
  hint,
  currentUrl,
  providerName,
}: {
  id: string;
  imageType: ProviderImageType;
  label: string;
  hint: string;
  currentUrl: string | null;
  providerName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    setSuccess(null);
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file first.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File exceeds 1MB limit.");
      return;
    }
    if (!ACCEPT.includes(file.type)) {
      setError("Unsupported file type. Use png, jpg, webp or svg.");
      return;
    }
    formData.set("id", id);
    formData.set("imageType", imageType);
    startTransition(async () => {
      const result = await uploadProviderImage(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("Image updated.");
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4">
        <div className="flex size-24 items-center justify-center rounded-lg border bg-surface">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt={`${providerName} ${label.toLowerCase()}`}
              className="max-h-20 max-w-20 object-contain"
            />
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
        <form ref={formRef} action={action} className="grid flex-1 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId}>Replace {label.toLowerCase()}</Label>
            <Input
              id={inputId}
              type="file"
              name="image"
              accept={ACCEPT.join(",")}
              required
            />
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="solid" size="sm" disabled={pending}>
              {pending ? "Uploading…" : "Upload"}
            </Button>
            {error ? <span className="text-sm text-destructive">{error}</span> : null}
            {success ? (
              <span className="text-sm text-mahalo-blue-600">{success}</span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
