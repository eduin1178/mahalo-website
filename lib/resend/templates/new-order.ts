import "server-only";

import type {
  AddOn,
  AddressJson,
  Customer,
  Order,
  Plan,
  Provider,
} from "@/lib/db/schema";
import { formatUsd } from "@/lib/orders/totals";
import { formatSpeed } from "@/lib/plans/speed";

export type NewOrderEmailData = {
  order: Order;
  customer: Customer;
  provider: Provider;
  plan: Plan;
  addOns: AddOn[];
  monthlyStandard: number;
  monthlyAutopay: number;
  monthlyTotal: number;
};

const escape = (raw: string): string =>
  raw
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");

function fmtAddress(addr: AddressJson | null): string {
  if (!addr) return "—";
  const parts = [
    addr.line1,
    addr.line2,
    `${addr.city}, ${addr.state} ${addr.zip}`,
  ].filter(Boolean);
  return escape(parts.join("\n"));
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
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

export function renderNewOrderEmail(data: NewOrderEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { order, customer, provider, plan, addOns, monthlyTotal } = data;
  const orderShort = order.id.slice(0, 8);
  const subject = `New order #${orderShort} — ${provider.name} ${plan.name}`;

  const addOnsRows = addOns.length
    ? addOns
        .map(
          (a) =>
            `<tr><td style="padding:4px 8px">${escape(a.name)}</td><td style="padding:4px 8px;text-align:right">${formatUsd(Number(a.price))}/mo</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2" style="padding:4px 8px;color:#666">None</td></tr>`;

  const html = `<!doctype html>
<html><body style="font-family:Inter,Arial,sans-serif;color:#0b1733;background:#f5f7fb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(11,23,51,.06)">
    <div style="background:linear-gradient(135deg,#0b1733,#1d4ed8,#06b6d4);padding:24px;color:#fff">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.85">New order</div>
      <div style="font-size:22px;font-weight:600;margin-top:4px">#${escape(orderShort)} · ${escape(provider.name)}</div>
    </div>
    <div style="padding:24px">
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:0 0 8px">Customer</h2>
      <p style="margin:0 0 16px;line-height:1.5">
        <strong>${escape(customer.firstName)} ${escape(customer.lastName)}</strong><br>
        ${escape(customer.email)}<br>
        ${escape(customer.phone)} (${escape(customer.phoneType)})
      </p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Plan</h2>
      <p style="margin:0 0 8px;line-height:1.5">
        <strong>${escape(plan.name)}</strong> — ${escape(formatSpeed(plan.speedValue, plan.speedUnit))}<br>
        ${formatUsd(Number(plan.priceStandard))}/mo standard · ${formatUsd(Number(plan.priceAutopay))}/mo autopay<br>
        Autopay: <strong>${order.autopayEnabled ? "ON" : "OFF"}</strong>
      </p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Add-ons</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${addOnsRows}</table>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Total</h2>
      <p style="margin:0 0 16px;font-size:18px"><strong>${formatUsd(monthlyTotal)}/mo</strong></p>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Installation address</h2>
      <pre style="margin:0 0 16px;font-family:inherit;white-space:pre-wrap;line-height:1.5">${fmtAddress(order.installationAddress)}</pre>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Billing address</h2>
      <pre style="margin:0 0 16px;font-family:inherit;white-space:pre-wrap;line-height:1.5">${fmtAddress(order.billingAddress ?? order.installationAddress)}</pre>

      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin:16px 0 8px">Scheduled installation</h2>
      <p style="margin:0">${escape(fmtDate(order.scheduledAt))}</p>
    </div>
  </div>
</body></html>`;

  const addOnsText = addOns.length
    ? addOns.map((a) => `  - ${a.name} (${formatUsd(Number(a.price))}/mo)`).join("\n")
    : "  (none)";

  const text = [
    `New order #${orderShort}`,
    "",
    `Customer: ${customer.firstName} ${customer.lastName} <${customer.email}>`,
    `Phone: ${customer.phone} (${customer.phoneType})`,
    "",
    `Provider: ${provider.name}`,
    `Plan: ${plan.name} — ${formatSpeed(plan.speedValue, plan.speedUnit)}`,
    `Standard: ${formatUsd(Number(plan.priceStandard))}/mo · Autopay: ${formatUsd(Number(plan.priceAutopay))}/mo`,
    `Autopay enabled: ${order.autopayEnabled ? "yes" : "no"}`,
    "",
    "Add-ons:",
    addOnsText,
    "",
    `Total: ${formatUsd(monthlyTotal)}/mo`,
    "",
    "Installation address:",
    order.installationAddress
      ? `${order.installationAddress.line1}${order.installationAddress.line2 ? `, ${order.installationAddress.line2}` : ""}, ${order.installationAddress.city}, ${order.installationAddress.state} ${order.installationAddress.zip}`
      : "—",
    "",
    `Scheduled: ${fmtDate(order.scheduledAt)}`,
  ].join("\n");

  return { subject, html, text };
}
