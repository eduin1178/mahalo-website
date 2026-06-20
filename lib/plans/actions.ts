"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { planSpeedUnitValues, plans } from "@/lib/db/schema";
import { requireRole } from "@/lib/clerk/require-role";
import { speedToMbps } from "@/lib/plans/speed";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Use a price like 49.99")
  .refine((v) => Number(v) >= 0, "Must be ≥ 0");

const featuresSchema = z
  .string()
  .optional()
  .transform((raw) =>
    (raw ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );

const speedValueSchema = z.coerce
  .number({ message: "Enter a speed" })
  .positive("Speed must be greater than 0")
  .max(100000, "Speed is too large");
const speedUnitSchema = z.enum(planSpeedUnitValues, {
  message: "Choose a unit",
});

const planCreateSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(160),
  speedValue: speedValueSchema,
  speedUnit: speedUnitSchema,
  priceStandard: priceSchema,
  priceAutopay: priceSchema,
  features: featuresSchema,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

const planUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  speedValue: speedValueSchema,
  speedUnit: speedUnitSchema,
  priceStandard: priceSchema,
  priceAutopay: priceSchema,
  features: featuresSchema,
  sortOrder: z.coerce.number().int().min(0).max(999),
});

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (value === null) return false;
  const str = String(value).toLowerCase();
  return str === "on" || str === "true" || str === "1";
}

export async function createPlan(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");

  const parsed = planCreateSchema.safeParse({
    providerId: formData.get("providerId"),
    name: formData.get("name"),
    speedValue: formData.get("speedValue"),
    speedUnit: formData.get("speedUnit"),
    priceStandard: formData.get("priceStandard"),
    priceAutopay: formData.get("priceAutopay"),
    features: formData.get("features") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === null ? true : parseBoolean(formData.get("isActive")),
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
      .insert(plans)
      .values({
        providerId: parsed.data.providerId,
        name: parsed.data.name,
        speedValue: String(parsed.data.speedValue),
        speedUnit: parsed.data.speedUnit,
        speedMbps: speedToMbps(parsed.data.speedValue, parsed.data.speedUnit),
        priceStandard: parsed.data.priceStandard,
        priceAutopay: parsed.data.priceAutopay,
        features: parsed.data.features,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      })
      .returning({ id: plans.id });

    revalidatePath(`/admin/providers/${parsed.data.providerId}`);
    return { ok: true, data: { id: row.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create plan";
    return { ok: false, error: message };
  }
}

export async function updatePlan(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");

  const parsed = planUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    speedValue: formData.get("speedValue"),
    speedUnit: formData.get("speedUnit"),
    priceStandard: formData.get("priceStandard"),
    priceAutopay: formData.get("priceAutopay"),
    features: formData.get("features") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, speedValue, speedUnit, ...patch } = parsed.data;

  try {
    const db = getDb();
    const [row] = await db
      .update(plans)
      .set({
        ...patch,
        speedValue: String(speedValue),
        speedUnit,
        speedMbps: speedToMbps(speedValue, speedUnit),
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
      .returning({ providerId: plans.providerId });

    if (!row) return { ok: false, error: "Plan not found" };

    revalidatePath(`/admin/providers/${row.providerId}`);
    return { ok: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update plan";
    return { ok: false, error: message };
  }
}

export async function togglePlanActive(
  formData: FormData,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  await requireRole("admin");

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid plan id" };

  const db = getDb();
  const [current] = await db
    .select({ isActive: plans.isActive, providerId: plans.providerId })
    .from(plans)
    .where(eq(plans.id, id.data))
    .limit(1);

  if (!current) return { ok: false, error: "Plan not found" };

  const next = !current.isActive;
  await db
    .update(plans)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(plans.id, id.data));

  revalidatePath(`/admin/providers/${current.providerId}`);
  return { ok: true, data: { id: id.data, isActive: next } };
}

const reorderSchema = z.object({
  providerId: z.string().uuid(),
  orders: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.coerce.number().int().min(0).max(999),
    }),
  ),
});

export async function reorderPlans(input: {
  providerId: string;
  orders: { id: string; sortOrder: number }[];
}): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid reorder payload" };
  }

  const db = getDb();
  for (const { id, sortOrder } of parsed.data.orders) {
    await db
      .update(plans)
      .set({ sortOrder, updatedAt: new Date() })
      .where(eq(plans.id, id));
  }

  revalidatePath(`/admin/providers/${parsed.data.providerId}`);
  return { ok: true, data: undefined };
}
