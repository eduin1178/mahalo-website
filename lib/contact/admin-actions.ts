"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/clerk/require-role";
import { contactMessageStatusValues } from "@/lib/db/schema";

import { setContactMessageStatus } from "./queries";

export type UpdateMessageStatusResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateMessageStatus(
  id: string,
  status: string,
): Promise<UpdateMessageStatusResult> {
  await requireRole("agent");

  if (
    !contactMessageStatusValues.includes(
      status as (typeof contactMessageStatusValues)[number],
    )
  ) {
    return { ok: false, error: "Invalid status." };
  }

  await setContactMessageStatus(
    id,
    status as (typeof contactMessageStatusValues)[number],
  );

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
