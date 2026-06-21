"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { findProvidersByZip } from "@/lib/coverage/queries";
import { providerHasActiveAddOns } from "@/lib/add-ons/queries";
import { getDb } from "@/lib/db/client";
import {
  addOns,
  customers,
  orderStatusHistory,
  orders,
  phoneTypeValues,
  plans,
  type AddressJson,
} from "@/lib/db/schema";
import { CONSENT_VERSION } from "@/lib/legal/consent";
import { sendNewOrderEmail } from "@/lib/resend/send";
import { validateAddress } from "@/lib/usps/client";
import { triggerWebhook } from "@/lib/webhook/trigger";

import {
  DRAFT_COOKIE_MAX_AGE_SEC,
  DRAFT_COOKIE_NAME,
  signOrderId,
} from "./draft";
import { getCurrentDraft } from "./draft";

// Search is ZIP-only by design (see hero-search.tsx): no street address is
// collected at search time. The installation address is captured later, in the
// Details step.
const inputSchema = z.object({
  zip: z.string().trim().regex(/^\d{5}$/u, "Enter a 5-digit ZIP code."),
});

export type CreateDraftResult =
  | { ok: true; orderId: string; zip: string }
  | { ok: false; error: string };

export async function createDraftOrder(input: {
  zip?: string;
}): Promise<CreateDraftResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a 5-digit ZIP code." };
  }

  const validation = await validateAddress(parsed.data.zip);
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

const finalizeProviderSchema = z.object({
  providerId: z.string().uuid(),
});

export type FinalizeProviderResult = { ok: false; error: string };

/**
 * Persist the chosen provider (multi-provider ZIPs only). Clears any plan and
 * add-ons selected for a previously chosen provider, then sends the user to the
 * Plan step, which renders only this provider's plans.
 */
export async function finalizeProvider(input: {
  providerId: string;
}): Promise<FinalizeProviderResult> {
  const parsed = finalizeProviderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid selection." };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session expired. Start over." };
  }
  if (!draft.zipCode) {
    return { ok: false, error: "ZIP code is missing. Start over." };
  }

  const covered = await findProvidersByZip(draft.zipCode);
  if (!covered.some((p) => p.id === parsed.data.providerId)) {
    return { ok: false, error: "This provider isn't available for your ZIP." };
  }

  const db = getDb();
  await db
    .update(orders)
    .set({
      providerId: parsed.data.providerId,
      planId: null,
      addOnIds: [],
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  revalidatePath("/checkout", "layout");
  redirect("/checkout/plan");
}

const finalizePlanSchema = z.object({
  planId: z.string().uuid(),
});

export type FinalizePlanResult = { ok: false; error: string };

export async function finalizePlan(input: {
  planId: string;
}): Promise<FinalizePlanResult> {
  const parsed = finalizePlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid selection." };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session expired. Start over." };
  }
  if (!draft.zipCode) {
    return { ok: false, error: "ZIP code is missing. Start over." };
  }

  const db = getDb();
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, parsed.data.planId), eq(plans.isActive, true)))
    .limit(1);
  if (!plan) {
    return { ok: false, error: "This plan is no longer available." };
  }

  const covered = await findProvidersByZip(draft.zipCode);
  if (!covered.some((p) => p.id === plan.providerId)) {
    return { ok: false, error: "This plan isn't available for your ZIP." };
  }

  // Persist the chosen plan and clear any add-ons selected for a previously
  // chosen plan (a different provider may have different add-ons).
  await db
    .update(orders)
    .set({
      providerId: plan.providerId,
      planId: plan.id,
      addOnIds: [],
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  // Mark the shared checkout layout stale so downstream steps re-fetch the
  // updated draft on the redirect navigation.
  revalidatePath("/checkout", "layout");

  // Decide the skip here (not on the Customize page) so a no-add-ons funnel
  // never enters /customize — keeping browser-Back from Details clean.
  const hasAddOns = await providerHasActiveAddOns(plan.providerId);
  redirect(hasAddOns ? "/checkout/customize" : "/checkout/details");
}

const finalizeAddOnsSchema = z.object({
  addOnIds: z.array(z.string().uuid()).max(50),
});

export type FinalizeAddOnsResult = { ok: false; error: string };

export async function finalizeAddOns(input: {
  addOnIds: string[];
}): Promise<FinalizeAddOnsResult> {
  const parsed = finalizeAddOnsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid selection." };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session expired. Start over." };
  }
  if (!draft.providerId || !draft.planId) {
    return { ok: false, error: "Choose a plan first." };
  }

  const db = getDb();
  const requestedAddOnIds = Array.from(new Set(parsed.data.addOnIds));
  let validatedAddOnIds: string[] = [];

  if (requestedAddOnIds.length > 0) {
    const rows = await db
      .select({ id: addOns.id })
      .from(addOns)
      .where(
        and(
          inArray(addOns.id, requestedAddOnIds),
          eq(addOns.providerId, draft.providerId),
          eq(addOns.isActive, true),
        ),
      );
    if (rows.length !== requestedAddOnIds.length) {
      return {
        ok: false,
        error: "One or more add-ons are no longer available.",
      };
    }
    validatedAddOnIds = rows.map((r) => r.id);
  }

  await db
    .update(orders)
    .set({ addOnIds: validatedAddOnIds, updatedAt: new Date() })
    .where(eq(orders.id, draft.id));

  // Mark the shared checkout layout stale so downstream steps re-fetch the
  // updated draft on the redirect navigation.
  revalidatePath("/checkout", "layout");
  redirect("/checkout/details");
}

const addressSchema = z.object({
  line1: z.string().trim().min(1, "Required").max(200),
  line2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  city: z.string().trim().min(1, "Required").max(100),
  state: z
    .string()
    .trim()
    .length(2, "Use 2-letter state code")
    .transform((v) => v.toUpperCase()),
  zip: z.string().trim().regex(/^\d{5}$/u, "Enter a 5-digit ZIP"),
});

const customerInfoSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(80),
  lastName: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone")
    .max(32)
    .regex(/^[\d\s().+-]+$/u, "Invalid phone"),
  phoneType: z.enum(phoneTypeValues),
  installationAddress: addressSchema,
});

// Autopay is a price preference only. Payment instruments are collected over
// the phone by an agent, never captured or stored by the site.
const savePaymentSchema = z.object({ autopay: z.boolean() });

const finalizePhase2Schema = z.object({
  customer: customerInfoSchema,
  payment: savePaymentSchema,
});

export type FinalizePhase2Input = z.input<typeof finalizePhase2Schema>;
export type FinalizePhase2Result =
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function finalizePhase2(
  input: FinalizePhase2Input,
): Promise<FinalizePhase2Result> {
  const parsed = finalizePhase2Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session expired. Start over." };
  }
  if (!draft.providerId || !draft.planId) {
    return { ok: false, error: "Choose a plan first." };
  }

  const c = parsed.data.customer;
  const installation: AddressJson = {
    line1: c.installationAddress.line1,
    line2: c.installationAddress.line2,
    city: c.installationAddress.city,
    state: c.installationAddress.state,
    zip: c.installationAddress.zip,
  };
  const db = getDb();

  const [customer] = await db
    .insert(customers)
    .values({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      phoneType: c.phoneType,
    })
    .onConflictDoUpdate({
      target: customers.email,
      set: {
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        phoneType: c.phoneType,
        updatedAt: new Date(),
      },
    })
    .returning({ id: customers.id });

  await db
    .update(orders)
    .set({
      customerId: customer.id,
      installationAddress: installation,
      zipCode: installation.zip,
      autopayEnabled: parsed.data.payment.autopay,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  // Mark the shared checkout layout stale so downstream steps re-fetch the
  // updated draft on the redirect navigation.
  revalidatePath("/checkout", "layout");
  redirect("/checkout/schedule");
}

const callWindowSchema = z.object({
  year: z.number().int().min(2024).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  // Only the three fixed window start hours are accepted.
  hour: z.union([z.literal(8), z.literal(10), z.literal(14)]),
  consent: z.literal(true),
});

export type ScheduleInstallationInput = z.input<typeof callWindowSchema>;
export type ScheduleInstallationResult = { ok: false; error: string };

/**
 * Persist the customer's preferred window for the advisor's confirmation call
 * (final checkout step) and the consent stamp. Does NOT set the installation
 * schedule (`scheduledAt`) — an agent sets that later in the back office.
 */
export async function scheduleInstallation(
  input: ScheduleInstallationInput,
): Promise<ScheduleInstallationResult> {
  const parsed = callWindowSchema.safeParse(input);
  if (!parsed.success) {
    const consentMissing = parsed.error.issues.some(
      (issue) => issue.path[0] === "consent",
    );
    return {
      ok: false,
      error: consentMissing
        ? "You must accept the Terms of Service and Privacy Policy to continue."
        : "Pick a valid date and time.",
    };
  }
  const { year, month, day, hour } = parsed.data;

  const preferredCallAt = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
  if (
    preferredCallAt.getUTCFullYear() !== year ||
    preferredCallAt.getUTCMonth() !== month - 1 ||
    preferredCallAt.getUTCDate() !== day
  ) {
    return { ok: false, error: "Pick a valid date." };
  }

  const dow = preferredCallAt.getUTCDay();
  if (dow === 0) {
    return { ok: false, error: "Pick a day from Monday to Saturday." };
  }

  if (preferredCallAt.getTime() <= Date.now()) {
    return { ok: false, error: "Pick a future date and time." };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session has expired. Start over." };
  }
  if (!draft.customerId) {
    return { ok: false, error: "Add your customer info first." };
  }

  const db = getDb();
  await db
    .update(orders)
    .set({
      preferredCallAt,
      termsAcceptedAt: new Date(),
      termsVersion: CONSENT_VERSION,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  redirect("/checkout/confirmation");
}

export type SubmitOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function submitOrder(): Promise<SubmitOrderResult> {
  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session has expired. Start over." };
  }
  if (
    !draft.customerId ||
    !draft.providerId ||
    !draft.planId ||
    !draft.zipCode ||
    !draft.installationAddress ||
    !draft.preferredCallAt
  ) {
    return { ok: false, error: "Order is incomplete." };
  }
  if (!draft.termsAcceptedAt) {
    return {
      ok: false,
      error:
        "We couldn't confirm your consent. Go back and accept the Terms of Service and Privacy Policy.",
    };
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "Pending", updatedAt: new Date() })
      .where(eq(orders.id, draft.id));
    await tx.insert(orderStatusHistory).values({
      orderId: draft.id,
      status: "Pending",
      changedBy: null,
      notes: "Submitted by customer",
    });
  });

  try {
    const store = await cookies();
    store.delete(DRAFT_COOKIE_NAME);
  } catch {
    // Server Components can't mutate cookies; the status guard above already
    // prevents re-submission, so leaving the cookie until natural expiry is safe.
  }

  const [emailRes, webhookRes] = await Promise.allSettled([
    sendNewOrderEmail(draft.id),
    triggerWebhook(draft.id),
  ]);
  if (emailRes.status === "rejected") {
    console.error(`[submitOrder] email rejected for ${draft.id}`, emailRes.reason);
  } else if (!emailRes.value.ok) {
    console.error(`[submitOrder] email failed for ${draft.id}: ${emailRes.value.error}`);
  }
  if (webhookRes.status === "rejected") {
    console.error(`[submitOrder] webhook rejected for ${draft.id}`, webhookRes.reason);
  } else if (!webhookRes.value.ok) {
    console.error(`[submitOrder] webhook failed for ${draft.id}: ${webhookRes.value.error}`);
  }

  return { ok: true, orderId: draft.id };
}
