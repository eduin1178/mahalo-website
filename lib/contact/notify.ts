import "server-only";

import { getFromEmail, getResend } from "@/lib/resend/client";
import { renderContactEmail } from "@/lib/resend/templates/contact";
import { getSetting } from "@/lib/settings/queries";
import { postWebhook, type TriggerWebhookResult } from "@/lib/webhook/trigger";

import type { ContactMessage } from "@/lib/db/schema";

export type SendContactEmailResult =
  | { ok: true; id: string | null; mocked?: true }
  | { ok: false; error: string };

export async function sendContactEmail(
  message: ContactMessage,
): Promise<SendContactEmailResult> {
  const recipient = await getSetting("notification_email");
  if (!recipient) {
    console.warn(
      "[resend] notification_email not configured; skipping contact email",
    );
    return { ok: true, id: null, mocked: true };
  }

  const { subject, html, text } = renderContactEmail(message);

  const resend = getResend();
  if (!resend) {
    console.warn(
      `[resend] RESEND_API_KEY not set; would have emailed ${recipient} subject="${subject}"`,
    );
    return { ok: true, id: null, mocked: true };
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: recipient,
      replyTo: message.email,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[resend] contact send failed", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? null };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown email error";
    console.error("[resend] contact send threw", err);
    return { ok: false, error };
  }
}

export async function triggerContactWebhook(
  message: ContactMessage,
): Promise<TriggerWebhookResult> {
  return postWebhook(
    "contact.submitted",
    { message },
    `contact=${message.id}`,
  );
}
