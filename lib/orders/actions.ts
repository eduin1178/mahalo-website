"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/clerk/require-role";
import { getDb } from "@/lib/db/client";
import {
  orderStatusHistory,
  orderStatusValues,
  orders,
  type OrderStatus,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const statusEnum = z.enum(orderStatusValues);

const changeStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: statusEnum,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export async function changeOrderStatus(
  formData: FormData,
): Promise<ActionResult<{ status: OrderStatus }>> {
  await requireRole("agent");
  const { userId } = await auth();

  const parsed = changeStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { orderId, status, notes } = parsed.data;

  const db = getDb();

  const [current] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!current) return { ok: false, error: "Order not found" };
  if (current.status === status) {
    return { ok: false, error: `Order is already ${status}` };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await tx.insert(orderStatusHistory).values({
      orderId,
      status,
      changedBy: userId ?? null,
      notes,
    });
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
  return { ok: true, data: { status } };
}

const rescheduleSchema = z.object({
  orderId: z.string().uuid(),
  scheduledAt: z
    .string()
    .min(1, "Pick a date and time")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
});

function validateInstallationWindow(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return "Invalid date";
  if (date.getTime() <= Date.now()) return "Must be in the future";
  const day = date.getDay();
  if (day === 0) return "Sunday is not available";
  const hour = date.getHours();
  if (hour < 8 || hour > 17) return "Hours are 8:00 AM – 5:00 PM";
  return null;
}

export async function rescheduleOrder(
  formData: FormData,
): Promise<ActionResult<{ scheduledAt: string }>> {
  await requireRole("agent");
  const { userId } = await auth();

  const parsed = rescheduleSchema.safeParse({
    orderId: formData.get("orderId"),
    scheduledAt: formData.get("scheduledAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const date = new Date(parsed.data.scheduledAt);
  const windowError = validateInstallationWindow(date);
  if (windowError) {
    return {
      ok: false,
      error: windowError,
      fieldErrors: { scheduledAt: [windowError] },
    };
  }

  const db = getDb();
  const [current] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, parsed.data.orderId))
    .limit(1);

  if (!current) return { ok: false, error: "Order not found" };

  const nextStatus: OrderStatus = "Scheduled";
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ scheduledAt: date, status: nextStatus, updatedAt: new Date() })
      .where(eq(orders.id, parsed.data.orderId));
    if (current.status !== nextStatus) {
      await tx.insert(orderStatusHistory).values({
        orderId: parsed.data.orderId,
        status: nextStatus,
        changedBy: userId ?? null,
        notes: `Rescheduled to ${date.toISOString()}`,
      });
    }
  });

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath(`/admin/orders`);
  return { ok: true, data: { scheduledAt: date.toISOString() } };
}
