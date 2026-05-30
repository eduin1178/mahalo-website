import "server-only";

import type { ContactMessage } from "@/lib/db/schema";

const escape = (raw: string): string =>
  raw
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");

function fmtDate(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function renderContactEmail(message: ContactMessage): {
  subject: string;
  html: string;
  text: string;
} {
  const fullName = `${message.firstName} ${message.lastName}`.trim();
  const subject = `New contact message — ${fullName}`;

  const html = `<!doctype html>
<html><body style="font-family:Inter,Arial,sans-serif;color:#0b1733;background:#f5f7fb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(11,23,51,.06)">
    <div style="background:linear-gradient(135deg,#0b1733,#1d4ed8,#06b6d4);padding:24px;color:#fff">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.85">New contact message</div>
      <div style="font-size:22px;font-weight:600;margin-top:4px">${escape(fullName)}</div>
    </div>
    <div style="padding:24px">
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:0 0 8px">Contact</h2>
      <p style="margin:0 0 16px;line-height:1.5">
        ${escape(message.email)}<br>
        ${escape(message.phone)}<br>
        ZIP ${escape(message.zipCode)}
      </p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Message</h2>
      <p style="margin:0 0 16px;line-height:1.5;white-space:pre-wrap">${escape(message.message)}</p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Consent</h2>
      <p style="margin:0 0 16px;line-height:1.5">${message.consent ? "Granted" : "Not granted"} · ${escape(fmtDate(message.createdAt))}</p>
    </div>
  </div>
</body></html>`;

  const text = [
    `New contact message`,
    "",
    `From: ${fullName} <${message.email}>`,
    `Phone: ${message.phone}`,
    `ZIP: ${message.zipCode}`,
    "",
    "Message:",
    message.message,
    "",
    `Consent: ${message.consent ? "granted" : "not granted"}`,
    `Received: ${fmtDate(message.createdAt)}`,
  ].join("\n");

  return { subject, html, text };
}
