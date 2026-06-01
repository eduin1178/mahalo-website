"use server";

import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { findProvidersByZip } from "@/lib/coverage/queries";
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
import { sendNewOrderEmail } from "@/lib/resend/send";
import { validateAddress } from "@/lib/usps/client";
import { triggerWebhook } from "@/lib/webhook/trigger";

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

const finalizePhase1Schema = z.object({
  planId: z.string().uuid(),
  addOnIds: z.array(z.string().uuid()).max(50),
});

export type FinalizePhase1Result = { ok: false; error: string };

export async function finalizePhase1(input: {
  planId: string;
  addOnIds: string[];
}): Promise<FinalizePhase1Result> {
  const parsed = finalizePhase1Schema.safeParse(input);
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

  const requestedAddOnIds = Array.from(new Set(parsed.data.addOnIds));
  let validatedAddOnIds: string[] = [];

  if (requestedAddOnIds.length > 0) {
    const rows = await db
      .select({ id: addOns.id })
      .from(addOns)
      .where(
        and(
          inArray(addOns.id, requestedAddOnIds),
          eq(addOns.providerId, plan.providerId),
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
    .set({
      providerId: plan.providerId,
      planId: plan.id,
      addOnIds: validatedAddOnIds,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

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

const customerInfoSchema = z
  .object({
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
    useDifferentBilling: z.boolean(),
    billingAddress: addressSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.useDifferentBilling && !v.billingAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["billingAddress"],
        message: "Billing address is required",
      });
    }
  });

function luhnValid(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum > 0 && sum % 10 === 0;
}

const cardSchema = z.object({
  type: z.literal("card"),
  number: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/gu, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{13,19}$/u, "Enter a valid card number")
        .refine(luhnValid, "Enter a valid card number"),
    ),
  holder: z.string().trim().min(2, "Required").max(120),
  exp: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/u, "Use MM/YY"),
  cvv: z.string().trim().regex(/^\d{3,4}$/u, "Invalid CVV"),
});

const achSchema = z.object({
  type: z.literal("ach"),
  routing: z.string().trim().regex(/^\d{9}$/u, "Routing must be 9 digits"),
  account: z.string().trim().regex(/^\d{4,17}$/u, "Invalid account number"),
  accountType: z.enum(["checking", "savings"]),
});

const savePaymentSchema = z.discriminatedUnion("autopay", [
  z.object({ autopay: z.literal(false) }),
  z.object({
    autopay: z.literal(true),
    payment: z.discriminatedUnion("type", [cardSchema, achSchema]),
  }),
]);

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
  const billing: AddressJson | null =
    c.useDifferentBilling && c.billingAddress
      ? {
          line1: c.billingAddress.line1,
          line2: c.billingAddress.line2,
          city: c.billingAddress.city,
          state: c.billingAddress.state,
          zip: c.billingAddress.zip,
        }
      : null;

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
      billingAddress: billing,
      zipCode: installation.zip,
      autopayEnabled: parsed.data.payment.autopay,
      paymentData: parsed.data.payment.autopay
        ? parsed.data.payment.payment
        : null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  redirect("/checkout/schedule");
}

const SCHEDULE_HOUR_MIN = 8;
const SCHEDULE_HOUR_MAX = 17;

const scheduleSchema = z.object({
  year: z.number().int().min(2024).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(SCHEDULE_HOUR_MIN).max(SCHEDULE_HOUR_MAX),
});

export type ScheduleInstallationInput = z.input<typeof scheduleSchema>;
export type ScheduleInstallationResult = { ok: false; error: string };

export async function scheduleInstallation(
  input: ScheduleInstallationInput,
): Promise<ScheduleInstallationResult> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pick a valid date and time." };
  }
  const { year, month, day, hour } = parsed.data;

  const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
  if (
    scheduledAt.getUTCFullYear() !== year ||
    scheduledAt.getUTCMonth() !== month - 1 ||
    scheduledAt.getUTCDate() !== day
  ) {
    return { ok: false, error: "Pick a valid date." };
  }

  const dow = scheduledAt.getUTCDay();
  if (dow === 0) {
    return { ok: false, error: "We don't install on Sundays." };
  }

  if (scheduledAt.getTime() <= Date.now()) {
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
    .set({ scheduledAt, updatedAt: new Date() })
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
    !draft.scheduledAt
  ) {
    return { ok: false, error: "Order is incomplete." };
  }
  if (draft.autopayEnabled && !draft.paymentData) {
    return { ok: false, error: "Payment details are missing." };
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
