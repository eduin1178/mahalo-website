import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = new Resend(apiKey);
  return cached;
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@mahaloenterprise.com";
}
