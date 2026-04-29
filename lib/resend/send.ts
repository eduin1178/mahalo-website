import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  addOns,
  customers,
  orders,
  plans,
  providers,
} from "@/lib/db/schema";
import { calculateTotal } from "@/lib/orders/totals";
import { getSetting } from "@/lib/settings/queries";

import { getFromEmail, getResend } from "./client";
import { renderNewOrderEmail } from "./templates/new-order";

export type SendNewOrderEmailResult =
  | { ok: true; id: string | null; mocked?: true }
  | { ok: false; error: string };

export async function sendNewOrderEmail(
  orderId: string,
): Promise<SendNewOrderEmailResult> {
  const db = getDb();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return { ok: false, error: "Order not found." };
  if (!order.customerId || !order.providerId || !order.planId) {
    return { ok: false, error: "Order is incomplete." };
  }

  const [[customer], [provider], [plan]] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1),
    db.select().from(providers).where(eq(providers.id, order.providerId)).limit(1),
    db.select().from(plans).where(eq(plans.id, order.planId)).limit(1),
  ]);
  if (!customer || !provider || !plan) {
    return { ok: false, error: "Order references missing records." };
  }

  const ids = order.addOnIds ?? [];
  const selectedAddOns =
    ids.length > 0
      ? await db.select().from(addOns).where(inArray(addOns.id, ids))
      : [];

  const breakdown = await calculateTotal(order);
  if (!breakdown) return { ok: false, error: "Could not compute total." };

  const recipient = await getSetting("notification_email");
  if (!recipient) {
    console.warn("[resend] notification_email not configured; skipping email");
    return { ok: true, id: null, mocked: true };
  }

  const { subject, html, text } = renderNewOrderEmail({
    order,
    customer,
    provider,
    plan,
    addOns: selectedAddOns,
    monthlyStandard: breakdown.monthlyStandard,
    monthlyAutopay: breakdown.monthlyAutopay,
    monthlyTotal: breakdown.monthlyTotal,
  });

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
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[resend] send failed", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[resend] send threw", err);
    return { ok: false, error: message };
  }
}
