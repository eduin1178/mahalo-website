"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = startOfTodayLocal();

  function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setServerError(null);

    if (!date || hour === null) {
      setServerError("Elige un día y un horario.");
      return;
    }

    const payload = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour,
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
            Elige un día
          </h2>
          <p className="text-sm text-muted-foreground">
            La instalación está disponible de lunes a sábado.
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
            Elige un horario
          </h2>
          <p className="text-sm text-muted-foreground">
            Los turnos van de 8:00 AM a 5:00 PM, cada hora.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Horario de instalación"
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

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={pending || !date || hour === null}
        >
          {pending ? "Enviando…" : "Confirmar pedido"}
        </Button>
      </div>
    </form>
  );
}
