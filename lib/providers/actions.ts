"use server";

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { providers, type Provider } from "@/lib/db/schema";
import { requireRole } from "@/lib/clerk/require-role";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const providerCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR, "Must be a hex color (e.g. #0B1F4D)"),
  isActive: z.boolean().default(true),
});

const providerUpdateSchema = providerCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (value === null) return false;
  const str = String(value).toLowerCase();
  return str === "on" || str === "true" || str === "1";
}

export async function createProvider(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");

  const isActiveRaw = formData.get("isActive");
  const parsed = providerCreateSchema.safeParse({
    name: formData.get("name"),
    primaryColor: formData.get("primaryColor"),
    isActive: isActiveRaw === null ? true : parseBoolean(isActiveRaw),
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
      .insert(providers)
      .values({
        name: parsed.data.name,
        primaryColor: parsed.data.primaryColor,
        isActive: parsed.data.isActive,
      })
      .returning({ id: providers.id });

    revalidatePath("/admin/providers");
    return { ok: true, data: { id: row.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create provider";
    if (message.includes("providers_name_unique") || message.toLowerCase().includes("unique")) {
      return {
        ok: false,
        error: "A provider with that name already exists",
        fieldErrors: { name: ["Already in use"] },
      };
    }
    return { ok: false, error: message };
  }
}

export async function updateProvider(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");

  const raw = {
    id: formData.get("id"),
    name: formData.get("name") ?? undefined,
    primaryColor: formData.get("primaryColor") ?? undefined,
  };

  const parsed = providerUpdateSchema.safeParse(raw);
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
    await db
      .update(providers)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(providers.id, id));

    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}`);
    return { ok: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update provider";
    if (message.toLowerCase().includes("unique")) {
      return {
        ok: false,
        error: "A provider with that name already exists",
        fieldErrors: { name: ["Already in use"] },
      };
    }
    return { ok: false, error: message };
  }
}

export async function toggleProviderActive(
  formData: FormData,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  await requireRole("admin");

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid provider id" };

  const db = getDb();
  const [current] = await db
    .select({ isActive: providers.isActive })
    .from(providers)
    .where(eq(providers.id, id.data))
    .limit(1);

  if (!current) return { ok: false, error: "Provider not found" };

  const next = !current.isActive;
  await db
    .update(providers)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(providers.id, id.data));

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${id.data}`);
  return { ok: true, data: { id: id.data, isActive: next } };
}

const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const MAX_LOGO_BYTES = 1024 * 1024; // 1MB

export async function uploadProviderLogo(
  formData: FormData,
): Promise<ActionResult<{ logoUrl: string }>> {
  await requireRole("admin");

  const idCheck = z.string().uuid().safeParse(formData.get("id"));
  if (!idCheck.success) return { ok: false, error: "Invalid provider id" };
  const id = idCheck.data;

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: "File exceeds 1MB limit" };
  }
  const ext = ALLOWED_LOGO_TYPES[file.type];
  if (!ext) {
    return { ok: false, error: "Unsupported file type. Use png, jpg, webp or svg." };
  }

  const db = getDb();
  const [existing] = await db
    .select({ logoUrl: providers.logoUrl })
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "Provider not found" };

  const dir = path.join(process.cwd(), "public", "uploads", "providers");
  await mkdir(dir, { recursive: true });

  const filename = `${id}.${ext}`;
  const fullPath = path.join(dir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, bytes);

  // Remove previous logo if extension changed (different filename).
  if (existing.logoUrl) {
    const prevName = path.basename(existing.logoUrl);
    if (prevName !== filename) {
      const prevPath = path.join(dir, prevName);
      try {
        await unlink(prevPath);
      } catch {
        // ignore: missing or in use
      }
    }
  }

  const logoUrl = `/uploads/providers/${filename}?v=${Date.now()}`;
  await db
    .update(providers)
    .set({ logoUrl, updatedAt: new Date() })
    .where(eq(providers.id, id));

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${id}`);
  return { ok: true, data: { logoUrl } };
}

export type ProviderRow = Provider;
