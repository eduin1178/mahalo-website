"use server";

import { z } from "zod";

import { sendContactEmail, triggerContactWebhook } from "./notify";
import { insertContactMessage } from "./queries";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(80),
  lastName: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone")
    .max(32)
    .regex(/^[\d\s().+-]+$/u, "Invalid phone"),
  zip: z.string().trim().regex(/^\d{5}$/u, "Enter a 5-digit ZIP"),
  message: z.string().trim().min(1, "Required").max(4000),
  consent: z.literal(true, {
    message: "You must accept the consent disclaimer to continue.",
  }),
  // Honeypot: must stay empty. Bots fill every field they find.
  company: z.string().max(0).optional(),
});

export type SubmitContactInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string;
  message: string;
  consent: boolean;
  company?: string;
};

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitContact(
  input: SubmitContactInput,
): Promise<SubmitContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  // Honeypot tripped: respond as success but persist/notify nothing.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return { ok: true };
  }

  const message = await insertContactMessage({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    zipCode: parsed.data.zip,
    message: parsed.data.message,
    consent: parsed.data.consent,
  });

  // Persist-first: the lead is already saved, so a Resend/n8n outage can never
  // lose it. Notification failures are logged, never thrown.
  const [emailRes, webhookRes] = await Promise.allSettled([
    sendContactEmail(message),
    triggerContactWebhook(message),
  ]);
  if (emailRes.status === "rejected") {
    console.error(`[submitContact] email rejected for ${message.id}`, emailRes.reason);
  } else if (!emailRes.value.ok) {
    console.error(`[submitContact] email failed for ${message.id}: ${emailRes.value.error}`);
  }
  if (webhookRes.status === "rejected") {
    console.error(`[submitContact] webhook rejected for ${message.id}`, webhookRes.reason);
  } else if (!webhookRes.value.ok) {
    console.error(`[submitContact] webhook failed for ${message.id}: ${webhookRes.value.error}`);
  }

  return { ok: true };
}
