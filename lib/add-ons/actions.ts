"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { addOns } from "@/lib/db/schema";
import { requireRole } from "@/lib/clerk/require-role";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Use a price like 9.99")
  .refine((v) => Number(v) >= 0, "Must be ≥ 0");

const descriptionSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const addOnCreateSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(160),
  description: descriptionSchema,
  price: priceSchema,
  isActive: z.boolean().default(true),
});

const addOnUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  description: descriptionSchema,
  price: priceSchema,
});

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (value === null) return false;
  const str = String(value).toLowerCase();
  return str === "on" || str === "true" || str === "1";
}

export async function createAddOn(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");

  const parsed = addOnCreateSchema.safeParse({
    providerId: formData.get("providerId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    isActive:
      formData.get("isActive") === null
        ? true
        : parseBoolean(formData.get("isActive")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const db = getDb();
    const [row] = await db
      .insert(addOns)
      .values({
        providerId: parsed.data.providerId,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        isActive: parsed.data.isActive,
      })
      .returning({ id: addOns.id });

    revalidatePath(`/admin/providers/${parsed.data.providerId}`);
    return { ok: true, data: { id: row.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create add-on";
    return { ok: false, error: message };
  }
}

export async function updateAddOn(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");

  const parsed = addOnUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, ...patch } = parsed.data;

  try {
    const db = getDb();
    const [row] = await db
      .update(addOns)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(addOns.id, id))
      .returning({ providerId: addOns.providerId });

    if (!row) return { ok: false, error: "Add-on not found" };

    revalidatePath(`/admin/providers/${row.providerId}`);
    return { ok: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update add-on";
    return { ok: false, error: message };
  }
}

export async function toggleAddOnActive(
  formData: FormData,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  await requireRole("admin");

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid add-on id" };

  const db = getDb();
  const [current] = await db
    .select({ isActive: addOns.isActive, providerId: addOns.providerId })
    .from(addOns)
    .where(eq(addOns.id, id.data))
    .limit(1);

  if (!current) return { ok: false, error: "Add-on not found" };

  const next = !current.isActive;
  await db
    .update(addOns)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(addOns.id, id.data));

  revalidatePath(`/admin/providers/${current.providerId}`);
  return { ok: true, data: { id: id.data, isActive: next } };
}
