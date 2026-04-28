import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

export const KNOWN_SETTING_KEYS = ["notification_email", "webhook_url"] as const;
export type KnownSettingKey = (typeof KNOWN_SETTING_KEYS)[number];

export type SettingRow = { key: string; value: string; updatedAt: Date };

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function getAllSettings(): Promise<SettingRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      key: settings.key,
      value: settings.value,
      updatedAt: settings.updatedAt,
    })
    .from(settings);
  return rows.sort((a, b) => a.key.localeCompare(b.key));
}
