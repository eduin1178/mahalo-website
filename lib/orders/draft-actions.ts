"use server";

import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { providerHasActiveAddOns } from "@/lib/add-ons/queries";
import { findProvidersByZip } from "@/lib/coverage/queries";
import { getDb } from "@/lib/db/client";
import { addOns, orders, plans } from "@/lib/db/schema";
import { validateAddress } from "@/lib/usps/client";

import {
  DRAFT_COOKIE_MAX_AGE_SEC,
  DRAFT_COOKIE_NAME,
  signOrderId,
} from "./draft";
import { getCurrentDraft } from "./draft";

const inputSchema = z
  .object({
    zip: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .refine((v) => Boolean(v.zip) || Boolean(v.address), {
    message: "Provide a ZIP or address",
  });

export type CreateDraftResult =
  | { ok: true; orderId: string; zip: string }
  | { ok: false; error: string };

export async function createDraftOrder(input: {
  zip?: string;
  address?: string;
}): Promise<CreateDraftResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Provide a ZIP or address." };
  }

  const lookupInput = parsed.data.zip ?? parsed.data.address!;
  const validation = await validateAddress(lookupInput);
  if (!validation.ok) {
    return { ok: false, error: validation.error.message };
  }

  const zip = validation.zip;
  const installationAddress = validation.normalized.street
    ? {
        line1: validation.normalized.street,
        city: validation.normalized.city ?? "",
        state: validation.normalized.state ?? "",
        zip,
      }
    : null;

  const db = getDb();
  const [created] = await db
    .insert(orders)
    .values({
      status: "Draft",
      zipCode: zip,
      installationAddress,
    })
    .returning({ id: orders.id });

  const store = await cookies();
  store.set(DRAFT_COOKIE_NAME, signOrderId(created.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DRAFT_COOKIE_MAX_AGE_SEC,
  });

  return { ok: true, orderId: created.id, zip };
}

export async function clearDraftCookie(): Promise<void> {
  const store = await cookies();
  store.delete(DRAFT_COOKIE_NAME);
}

const selectPlanSchema = z.object({
  planId: z.string().uuid(),
});

export type SelectPlanResult = { ok: false; error: string };

export async function selectPlan(input: {
  planId: string;
}): Promise<SelectPlanResult> {
  const parsed = selectPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid plan selection." };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session has expired. Start over." };
  }
  if (!draft.zipCode) {
    return { ok: false, error: "Missing ZIP on draft. Start over." };
  }

  const db = getDb();
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, parsed.data.planId), eq(plans.isActive, true)))
    .limit(1);

  if (!plan) {
    return { ok: false, error: "Plan not available." };
  }

  const covered = await findProvidersByZip(draft.zipCode);
  if (!covered.some((p) => p.id === plan.providerId)) {
    return { ok: false, error: "Plan not available for your ZIP." };
  }

  await db
    .update(orders)
    .set({
      providerId: plan.providerId,
      planId: plan.id,
      addOnIds: [],
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  const hasAddOns = await providerHasActiveAddOns(plan.providerId);
  redirect(hasAddOns ? "/checkout/add-ons" : "/checkout/summary");
}

const selectAddOnsSchema = z.object({
  addOnIds: z.array(z.string().uuid()).max(50),
});

export type SelectAddOnsResult = { ok: false; error: string };

export async function selectAddOns(input: {
  addOnIds: string[];
}): Promise<SelectAddOnsResult> {
  const parsed = selectAddOnsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid add-on selection." };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session has expired. Start over." };
  }
  if (!draft.providerId) {
    return { ok: false, error: "Choose a plan first." };
  }

  const ids = Array.from(new Set(parsed.data.addOnIds));
  const db = getDb();
  let validatedIds: string[] = [];

  if (ids.length > 0) {
    const rows = await db
      .select({ id: addOns.id })
      .from(addOns)
      .where(
        and(
          inArray(addOns.id, ids),
          eq(addOns.providerId, draft.providerId),
          eq(addOns.isActive, true),
        ),
      );

    if (rows.length !== ids.length) {
      return { ok: false, error: "One or more add-ons are no longer available." };
    }
    validatedIds = rows.map((r) => r.id);
  }

  await db
    .update(orders)
    .set({ addOnIds: validatedIds, updatedAt: new Date() })
    .where(eq(orders.id, draft.id));

  redirect("/checkout/summary");
}
