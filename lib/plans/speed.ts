import type { PlanSpeedUnit } from "@/lib/db/schema";

/**
 * Plan speed helpers.
 *
 * Speed is stored as three columns: `speedValue` (the displayed number),
 * `speedUnit` ("Mbps" | "Gbps"), and `speedMbps` (a normalized megabit-equivalent
 * used to compare/sort so that 1 Gbps outranks 940 Mbps). These pure helpers are
 * shared by the data backfill, the admin write path, and every display site.
 */

/** Megabit-equivalent of a (value, unit) pair. Gbps is multiplied by 1000. */
export function speedToMbps(value: number, unit: PlanSpeedUnit): number {
  return unit === "Gbps" ? Math.round(value * 1000) : Math.round(value);
}

/**
 * Parse a legacy free-text speed (e.g. "300 Mbps", "1 Gbps", "2 Gig") into its
 * structured form. "Gig" canonicalizes to "Gbps". Returns null when the string
 * does not match the expected `<number> <unit>` shape.
 */
export function parseSpeed(
  raw: string,
): { value: number; unit: PlanSpeedUnit; mbps: number } | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(Mbps|Gbps|Gig)\s*$/iu.exec(raw);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  const unit: PlanSpeedUnit = /^mbps$/iu.test(match[2]) ? "Mbps" : "Gbps";
  return { value, unit, mbps: speedToMbps(value, unit) };
}

/**
 * Render a structured speed for display, e.g. "300 Mbps" or "2 Gbps". Falls back
 * to an em dash when the speed is missing (an unparsed row awaiting correction).
 */
export function formatSpeed(
  value: string | number | null | undefined,
  unit: PlanSpeedUnit | null | undefined,
): string {
  if (value == null || unit == null) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n} ${unit}`;
}

/**
 * Pick the fastest plan by normalized speed. Plans without a `speedMbps` are
 * ranked lowest. Returns null for an empty list.
 */
export function fastestPlan<T extends { speedMbps: number | null }>(
  plans: readonly T[],
): T | null {
  let best: T | null = null;
  for (const plan of plans) {
    if (best === null || (plan.speedMbps ?? -1) > (best.speedMbps ?? -1)) {
      best = plan;
    }
  }
  return best;
}
