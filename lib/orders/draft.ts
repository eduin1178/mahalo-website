import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { orders, type Order } from "@/lib/db/schema";

export const DRAFT_COOKIE_NAME = "mahalo_order_id";
export const DRAFT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function getSecret(): string {
  return (
    process.env.DRAFT_COOKIE_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    "mahalo-dev-secret"
  );
}

export function signOrderId(orderId: string): string {
  const sig = createHmac("sha256", getSecret())
    .update(orderId)
    .digest("base64url");
  return `${orderId}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return value;
}

export async function readDraftOrderId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(DRAFT_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyToken(raw);
}

export async function getCurrentDraft(): Promise<Order | null> {
  const orderId = await readDraftOrderId();
  if (!orderId) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!row) return null;
  if (row.status !== "Draft") return null;
  return row;
}
