import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  addOns,
  customers,
  orders,
  plans,
  providers,
  type AddOn,
  type Customer,
  type Order,
  type Plan,
  type Provider,
} from "@/lib/db/schema";
import { calculateTotal } from "@/lib/orders/totals";
import { getSetting } from "@/lib/settings/queries";

export type WebhookPayload = {
  event: "order.submitted";
  emittedAt: string;
  order: Order;
  customer: Customer | null;
  provider: Provider | null;
  plan: Plan | null;
  addOns: AddOn[];
  totals: {
    monthlyStandard: number;
    monthlyAutopay: number;
    monthlyTotal: number;
    autopay: boolean;
  } | null;
};

export type TriggerWebhookResult =
  | { ok: true; status: number; attempts: number }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string; attempts: number };

const TIMEOUT_MS = 5_000;
const RETRY_BACKOFF_MS = 2_000;
const MAX_ATTEMPTS = 2;

export async function triggerWebhook(
  orderId: string,
): Promise<TriggerWebhookResult> {
  const url = await getSetting("webhook_url");
  if (!url) {
    console.warn("[webhook] webhook_url not configured; skipping");
    return { ok: true, skipped: true, reason: "webhook_url not set" };
  }

  const payload = await buildPayload(orderId);
  if (!payload) {
    return { ok: false, error: "Order not found", attempts: 0 };
  }

  const body = JSON.stringify(payload);

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        console.info(
          `[webhook] order=${orderId} attempt=${attempt} status=${res.status} ok`,
        );
        return { ok: true, status: res.status, attempts: attempt };
      }
      lastError = `HTTP ${res.status}`;
      console.warn(
        `[webhook] order=${orderId} attempt=${attempt} failed status=${res.status}`,
      );
    } catch (err) {
      clearTimeout(timer);
      lastError =
        err instanceof Error ? err.message : "Unknown webhook error";
      console.warn(
        `[webhook] order=${orderId} attempt=${attempt} threw: ${lastError}`,
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
    }
  }

  console.error(
    `[webhook] order=${orderId} exhausted ${MAX_ATTEMPTS} attempts: ${lastError}`,
  );
  return { ok: false, error: lastError, attempts: MAX_ATTEMPTS };
}

async function buildPayload(orderId: string): Promise<WebhookPayload | null> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;

  const [customer, provider, plan] = await Promise.all([
    order.customerId
      ? db
          .select()
          .from(customers)
          .where(eq(customers.id, order.customerId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    order.providerId
      ? db
          .select()
          .from(providers)
          .where(eq(providers.id, order.providerId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    order.planId
      ? db
          .select()
          .from(plans)
          .where(eq(plans.id, order.planId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const ids = order.addOnIds ?? [];
  const selectedAddOns =
    ids.length > 0
      ? await db.select().from(addOns).where(inArray(addOns.id, ids))
      : [];

  const breakdown = await calculateTotal(order);

  return {
    event: "order.submitted",
    emittedAt: new Date().toISOString(),
    order,
    customer,
    provider,
    plan,
    addOns: selectedAddOns,
    totals: breakdown
      ? {
          monthlyStandard: breakdown.monthlyStandard,
          monthlyAutopay: breakdown.monthlyAutopay,
          monthlyTotal: breakdown.monthlyTotal,
          autopay: breakdown.autopay,
        }
      : null,
  };
}
