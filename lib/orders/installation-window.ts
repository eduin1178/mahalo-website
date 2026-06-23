/**
 * The four fixed advisor-call time windows offered at checkout. The order
 * persists only the START hour of the chosen window (`scheduledAt`'s UTC hour);
 * the interval is rendered only in the scheduling step (selector + live
 * review). Everywhere else (confirmation, order email, webhook, admin) renders
 * the start hour.
 */
export type InstallationWindow = {
  startHour: 8 | 10 | 14 | 17;
  /** Interval form shown in the scheduling step, e.g. "8 – 10 AM". */
  intervalLabel: string;
  /** Start-hour form shown downstream, e.g. "8:00 AM". */
  startLabel: string;
};

export const INSTALLATION_WINDOWS: readonly InstallationWindow[] = [
  { startHour: 8, intervalLabel: "8 – 10 AM", startLabel: "8:00 AM" },
  { startHour: 10, intervalLabel: "10 – 12 PM", startLabel: "10:00 AM" },
  { startHour: 14, intervalLabel: "2 – 4 PM", startLabel: "2:00 PM" },
  { startHour: 17, intervalLabel: "5 – 8 PM", startLabel: "5:00 PM" },
];

export const INSTALLATION_WINDOW_START_HOURS = [8, 10, 14, 17] as const;
export type InstallationWindowStartHour =
  (typeof INSTALLATION_WINDOW_START_HOURS)[number];

/** Type guard: true only for an allowed window start hour (8, 10, 14, 17). */
export function isValidWindowHour(
  hour: number,
): hour is InstallationWindowStartHour {
  return INSTALLATION_WINDOW_START_HOURS.includes(
    hour as InstallationWindowStartHour,
  );
}

export function windowFromHour(hour: number): InstallationWindow | null {
  return INSTALLATION_WINDOWS.find((w) => w.startHour === hour) ?? null;
}

/** Interval label for a start hour, or empty string if not a valid window. */
export function intervalLabel(hour: number): string {
  return windowFromHour(hour)?.intervalLabel ?? "";
}

/** Start-hour label for a start hour, or empty string if not a valid window. */
export function startLabel(hour: number): string {
  return windowFromHour(hour)?.startLabel ?? "";
}
