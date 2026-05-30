import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  contactMessages,
  type ContactMessage,
  type ContactMessageStatus,
  type NewContactMessage,
} from "@/lib/db/schema";

export async function insertContactMessage(
  data: Omit<NewContactMessage, "id" | "status" | "createdAt">,
): Promise<ContactMessage> {
  const db = getDb();
  const [row] = await db.insert(contactMessages).values(data).returning();
  return row;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const db = getDb();
  return db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
}

export async function getContactMessage(
  id: string,
): Promise<ContactMessage | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.id, id))
    .limit(1);
  return row ?? null;
}

export async function countNewMessages(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(contactMessages)
    .where(eq(contactMessages.status, "new"));
  return row?.value ?? 0;
}

export async function setContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<void> {
  const db = getDb();
  await db
    .update(contactMessages)
    .set({ status })
    .where(eq(contactMessages.id, id));
}
