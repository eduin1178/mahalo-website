"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/clerk/require-role";
import { getDb } from "@/lib/db/client";
import { providerCoverage } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const ZIP = /^\d{5}$/;

const addZipsSchema = z.object({
  providerId: z.string().uuid(),
  zips: z
    .string()
    .trim()
    .min(1, "Enter at least one ZIP code")
    .transform((raw, ctx) => {
      const parts = raw
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter at least one ZIP code",
        });
        return z.NEVER;
      }
      if (parts.length > 2000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Too many ZIPs in one batch (max 2000)",
        });
        return z.NEVER;
      }
      const bad = parts.filter((p) => !ZIP.test(p));
      if (bad.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid ZIP(s): ${bad.slice(0, 5).join(", ")}${bad.length > 5 ? "…" : ""}`,
        });
        return z.NEVER;
      }
      return parts;
    }),
});

const removeZipSchema = z.object({
  providerId: z.string().uuid(),
  zip: z.string().regex(ZIP, "Invalid ZIP"),
});

export async function addZips(
  formData: FormData,
): Promise<ActionResult<{ added: number; skipped: number }>> {
  await requireRole("admin");

  const parsed = addZipsSchema.safeParse({
    providerId: formData.get("providerId"),
    zips: formData.get("zips"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { providerId, zips } = parsed.data;
  const unique = Array.from(new Set(zips));

  try {
    const db = getDb();
    const inserted = await db
      .insert(providerCoverage)
      .values(unique.map((zipCode) => ({ providerId, zipCode })))
      .onConflictDoNothing({
        target: [providerCoverage.providerId, providerCoverage.zipCode],
      })
      .returning({ id: providerCoverage.id });

    revalidatePath("/admin/coverage");
    return {
      ok: true,
      data: {
        added: inserted.length,
        skipped: unique.length - inserted.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add ZIPs";
    return { ok: false, error: message };
  }
}

export async function removeZip(
  formData: FormData,
): Promise<ActionResult<{ zip: string }>> {
  await requireRole("admin");

  const parsed = removeZipSchema.safeParse({
    providerId: formData.get("providerId"),
    zip: formData.get("zip"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const db = getDb();
    await db
      .delete(providerCoverage)
      .where(
        and(
          eq(providerCoverage.providerId, parsed.data.providerId),
          eq(providerCoverage.zipCode, parsed.data.zip),
        ),
      );
    revalidatePath("/admin/coverage");
    return { ok: true, data: { zip: parsed.data.zip } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove ZIP";
    return { ok: false, error: message };
  }
}
