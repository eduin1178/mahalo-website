"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/clerk/require-role";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { KNOWN_SETTING_KEYS } from "@/lib/settings/queries";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const KEY_PATTERN = /^[a-z][a-z0-9_]{0,79}$/;

const customKeySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(80)
  .regex(
    KEY_PATTERN,
    "Use lowercase letters, numbers and underscores; must start with a letter",
  )
  .refine(
    (k) => !KNOWN_SETTING_KEYS.includes(k as (typeof KNOWN_SETTING_KEYS)[number]),
    { message: "Reserved key — edit it in the main form" },
  );

const knownSettingsSchema = z.object({
  notification_email: z
    .string()
    .trim()
    .max(254)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Must be a valid email or empty",
    }),
  webhook_url: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (v) => {
        if (v === "") return true;
        try {
          const url = new URL(v);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      },
      { message: "Must be a valid http(s) URL or empty" },
    ),
});

const setSettingSchema = z.object({
  key: customKeySchema,
  value: z.string().max(8192),
});

const deleteSettingSchema = z.object({
  key: customKeySchema,
});

async function upsertSetting(key: string, value: string) {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function saveKnownSettings(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = knownSettingsSchema.safeParse({
    notification_email: formData.get("notification_email") ?? "",
    webhook_url: formData.get("webhook_url") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await Promise.all([
      upsertSetting("notification_email", parsed.data.notification_email),
      upsertSetting("webhook_url", parsed.data.webhook_url),
    ]);
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save settings",
    };
  }
}

export async function setSetting(
  formData: FormData,
): Promise<ActionResult<{ key: string }>> {
  await requireRole("admin");

  const parsed = setSettingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await upsertSetting(parsed.data.key, parsed.data.value);
    revalidatePath("/admin/settings");
    return { ok: true, data: { key: parsed.data.key } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save setting",
    };
  }
}

export async function deleteSetting(
  formData: FormData,
): Promise<ActionResult<{ key: string }>> {
  await requireRole("admin");

  const parsed = deleteSettingSchema.safeParse({ key: formData.get("key") });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid key",
    };
  }

  try {
    const db = getDb();
    await db.delete(settings).where(eq(settings.key, parsed.data.key));
    revalidatePath("/admin/settings");
    return { ok: true, data: { key: parsed.data.key } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete setting",
    };
  }
}
