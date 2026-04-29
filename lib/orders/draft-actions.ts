"use server";

import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { providerHasActiveAddOns } from "@/lib/add-ons/queries";
import { findProvidersByZip } from "@/lib/coverage/queries";
import { getDb } from "@/lib/db/client";
import {
  addOns,
  customers,
  orders,
  phoneTypeValues,
  plans,
  type AddressJson,
} from "@/lib/db/schema";
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

export type CustomerInfoInput = z.input<typeof customerInfoSchema>;

export type SaveCustomerInfoResult =
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveCustomerInfo(
  input: CustomerInfoInput,
): Promise<SaveCustomerInfoResult> {
  const parsed = customerInfoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const draft = await getCurrentDraft();
  if (!draft) {
    return { ok: false, error: "Your session has expired. Start over." };
  }

  const data = parsed.data;
  const installation: AddressJson = {
    line1: data.installationAddress.line1,
    line2: data.installationAddress.line2,
    city: data.installationAddress.city,
    state: data.installationAddress.state,
    zip: data.installationAddress.zip,
  };
  const billing: AddressJson | null =
    data.useDifferentBilling && data.billingAddress
      ? {
          line1: data.billingAddress.line1,
          line2: data.billingAddress.line2,
          city: data.billingAddress.city,
          state: data.billingAddress.state,
          zip: data.billingAddress.zip,
        }
      : null;

  const db = getDb();

  const [customer] = await db
    .insert(customers)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      phoneType: data.phoneType,
    })
    .onConflictDoUpdate({
      target: customers.email,
      set: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        phoneType: data.phoneType,
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
      updatedAt: new Date(),
    })
    .where(eq(orders.id, draft.id));

  redirect("/checkout/payment");
}

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

export type SavePaymentInput = z.input<typeof savePaymentSchema>;
export type SavePaymentResult =
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// SECURITY: stored in plain text per requirement; PCI is client responsibility.
export async function savePayment(
  input: SavePaymentInput,
): Promise<SavePaymentResult> {
  const parsed = savePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
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
      autopayEnabled: parsed.data.autopay,
      paymentData: parsed.data.autopay ? parsed.data.payment : null,
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
