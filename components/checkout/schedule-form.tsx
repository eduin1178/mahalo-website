"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { SectionCard } from "@/components/checkout/section-card";
import { CONSENT_COPY } from "@/lib/legal/consent";
import {
  INSTALLATION_WINDOWS,
  intervalLabel,
  isValidWindowHour,
  type InstallationWindowStartHour,
} from "@/lib/orders/installation-window";
import { scheduleInstallation } from "@/lib/orders/draft-actions";
import { cn } from "@/lib/utils";

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
  const [hour, setHour] = useState<InstallationWindowStartHour | null>(
    initialHour !== undefined && isValidWindowHour(initialHour)
      ? initialHour
      : null,
  );
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
      setServerError("Choose a day and an installation window.");
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
      <SectionCard>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-mahalo-navy-900">
            Schedule installation
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a day (Monday through Saturday) and an installation window.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
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

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-mahalo-navy-900">
              Installation window
            </span>
            <div
              role="radiogroup"
              aria-label="Installation time window"
              className={cn(
                "grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1",
                !date && "opacity-60",
              )}
            >
              {INSTALLATION_WINDOWS.map((w) => {
                const checked = hour === w.startHour;
                return (
                  <label
                    key={w.startHour}
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                      checked
                        ? "border-mahalo-blue-600 bg-mahalo-blue-600 text-white"
                        : "border-border bg-background text-mahalo-navy-900 hover:border-mahalo-blue-600/40",
                      !date && "pointer-events-none",
                    )}
                  >
                    <input
                      type="radio"
                      name="hour"
                      value={w.startHour}
                      checked={checked}
                      onChange={() => setHour(w.startHour)}
                      className="sr-only"
                      disabled={!date}
                    />
                    {w.intervalLabel}
                  </label>
                );
              })}
            </div>
            {!date ? (
              <p className="text-xs text-muted-foreground">
                Choose a day first.
              </p>
            ) : null}
          </div>
        </div>

        {date && hour !== null ? (
          <p className="text-sm text-mahalo-navy-900">
            Installation:{" "}
            <span className="font-semibold">
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>{" "}
            · <span className="font-semibold">{intervalLabel(hour)}</span>
          </p>
        ) : null}
      </SectionCard>

      <SectionCard>
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
      </SectionCard>

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="h-12 w-full rounded-xl px-10 text-base font-semibold sm:w-auto"
          disabled={pending || !date || hour === null || !consent}
        >
          {pending ? "Submitting…" : "Place order"}
        </Button>
      </div>
    </form>
  );
}
