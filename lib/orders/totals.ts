import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { addOns, plans, type AddOn, type Order, type Plan } from "@/lib/db/schema";

export type TotalBreakdown = {
  plan: Plan;
  addOns: AddOn[];
  planPriceStandard: number;
  planPriceAutopay: number;
  addOnsMonthly: number;
  monthlyStandard: number;
  monthlyAutopay: number;
  monthlyTotal: number;
  autopay: boolean;
};

function n(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function calculateTotal(
  order: Order,
  autopay = order.autopayEnabled,
): Promise<TotalBreakdown | null> {
  if (!order.planId) return null;

  const db = getDb();
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, order.planId))
    .limit(1);
  if (!plan) return null;

  const ids = order.addOnIds ?? [];
  const selectedAddOns =
    ids.length > 0
      ? await db.select().from(addOns).where(inArray(addOns.id, ids))
      : [];

  const planPriceStandard = n(plan.priceStandard);
  const planPriceAutopay = n(plan.priceAutopay);
  const addOnsMonthly = selectedAddOns.reduce((sum, a) => sum + n(a.price), 0);
  const monthlyStandard = planPriceStandard + addOnsMonthly;
  const monthlyAutopay = planPriceAutopay + addOnsMonthly;

  return {
    plan,
    addOns: selectedAddOns,
    planPriceStandard,
    planPriceAutopay,
    addOnsMonthly,
    monthlyStandard,
    monthlyAutopay,
    monthlyTotal: autopay ? monthlyAutopay : monthlyStandard,
    autopay,
  };
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
