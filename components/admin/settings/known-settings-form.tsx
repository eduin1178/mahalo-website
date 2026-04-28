"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveKnownSettings } from "@/lib/settings/actions";

type Props = {
  notificationEmail: string;
  webhookUrl: string;
};

export function KnownSettingsForm({ notificationEmail, webhookUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function action(formData: FormData) {
    setErrors(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveKnownSettings(formData);
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
        <Label htmlFor="notification_email">Notification email</Label>
        <Input
          id="notification_email"
          name="notification_email"
          type="email"
          defaultValue={notificationEmail}
          placeholder="orders@mahaloenterprise.com"
          maxLength={254}
        />
        <p className="text-xs text-muted-foreground">
          Receives the &quot;new order&quot; email from Resend. Leave empty to disable.
        </p>
        {errors?.notification_email?.[0] ? (
          <p className="text-xs text-destructive">
            {errors.notification_email[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="webhook_url">Webhook URL</Label>
        <Input
          id="webhook_url"
          name="webhook_url"
          type="url"
          defaultValue={webhookUrl}
          placeholder="https://n8n.example.com/webhook/..."
          maxLength={2048}
        />
        <p className="text-xs text-muted-foreground">
          POST destination for new orders (n8n). Leave empty to disable.
        </p>
        {errors?.webhook_url?.[0] ? (
          <p className="text-xs text-destructive">{errors.webhook_url[0]}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
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
