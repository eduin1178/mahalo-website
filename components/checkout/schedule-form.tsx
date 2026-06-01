"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CONSENT_COPY } from "@/lib/legal/consent";
import { scheduleInstallation } from "@/lib/orders/draft-actions";
import { cn } from "@/lib/utils";

const HOUR_MIN = 8;
const HOUR_MAX = 17;
const HOURS = Array.from(
  { length: HOUR_MAX - HOUR_MIN + 1 },
  (_, i) => HOUR_MIN + i,
);

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ScheduleFormProps = {
  initialYear?: number;
  initialMonth?: number;
  initialDay?: number;
  initialHour?: number;
};

export function ScheduleForm({
  initialYear,
  initialMonth,
  initialDay,
  initialHour,
}: ScheduleFormProps) {
  const initialDate = useMemo(() => {
    if (
      initialYear !== undefined &&
      initialMonth !== undefined &&
      initialDay !== undefined
    ) {
      return new Date(initialYear, initialMonth - 1, initialDay);
    }
    return undefined;
  }, [initialYear, initialMonth, initialDay]);

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [hour, setHour] = useState<number | null>(initialHour ?? null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = startOfTodayLocal();

  function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setServerError(null);
    setConsentError(null);

    if (!date || hour === null) {
      setServerError("Choose a day and a time.");
      return;
    }

    if (!consent) {
      setConsentError(
        "You must accept the Terms of Service and Privacy Policy to continue.",
      );
      return;
    }

    const payload = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour,
      consent: true as const,
    };

    startTransition(async () => {
      const result = await scheduleInstallation(payload);
      if (result && !result.ok) {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-mahalo-navy-900">
            Choose a day
          </h2>
          <p className="text-sm text-muted-foreground">
            Installation is available Monday through Saturday.
          </p>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setHour(null);
          }}
          disabled={[{ before: today }, { dayOfWeek: [0] }]}
          className="self-start"
        />
      </section>

      <section
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border bg-background p-5",
          !date && "opacity-60",
        )}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-mahalo-navy-900">
            Choose a time
          </h2>
          <p className="text-sm text-muted-foreground">
            Slots run from 8:00 AM to 5:00 PM, every hour.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Installation time"
          className="grid grid-cols-2 gap-2 sm:grid-cols-5"
        >
          {HOURS.map((h) => {
            const checked = hour === h;
            return (
              <label
                key={h}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  checked
                    ? "border-mahalo-blue-600 bg-mahalo-blue-600 text-white"
                    : "border-border bg-background text-mahalo-navy-900 hover:border-mahalo-blue-600/40",
                  !date && "pointer-events-none",
                )}
              >
                <input
                  type="radio"
                  name="hour"
                  value={h}
                  checked={checked}
                  onChange={() => setHour(h)}
                  className="sr-only"
                  disabled={!date}
                />
                {formatHourLabel(h)}
              </label>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-mahalo-navy-900">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setConsentError(null);
            }}
            aria-invalid={consentError ? true : undefined}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-mahalo-blue-600"
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            {CONSENT_COPY.before}{" "}
            <Link
              href={CONSENT_COPY.termsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-mahalo-blue-600 hover:underline"
            >
              {CONSENT_COPY.termsLabel}
            </Link>{" "}
            {CONSENT_COPY.and}{" "}
            <Link
              href={CONSENT_COPY.privacyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-mahalo-blue-600 hover:underline"
            >
              {CONSENT_COPY.privacyLabel}
            </Link>
            {CONSENT_COPY.after}
          </span>
        </label>
        {consentError ? (
          <p role="alert" className="text-xs text-destructive">
            {consentError}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={pending || !date || hour === null || !consent}
        >
          {pending ? "Submitting…" : "Confirm order"}
        </Button>
      </div>
    </form>
  );
}
