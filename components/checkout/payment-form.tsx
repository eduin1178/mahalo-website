"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { savePayment } from "@/lib/orders/draft-actions";
import { cn } from "@/lib/utils";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Method = "card" | "ach";

type FieldErrors = Record<string, string | undefined>;

export type PaymentFormProps = {
  monthlyStandard: number;
  monthlyAutopay: number;
  initialAutopay: boolean;
  initialMethod: Method;
};

export function PaymentForm({
  monthlyStandard,
  monthlyAutopay,
  initialAutopay,
  initialMethod,
}: PaymentFormProps) {
  const [autopay, setAutopay] = useState(initialAutopay);
  const [method, setMethod] = useState<Method>(initialMethod);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const savings = Math.max(0, monthlyStandard - monthlyAutopay);

  function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setServerError(null);
    setErrors({});

    const fd = new FormData(formEvent.currentTarget);

    let payload: Parameters<typeof savePayment>[0];
    if (!autopay) {
      payload = { autopay: false };
    } else if (method === "card") {
      payload = {
        autopay: true,
        payment: {
          type: "card",
          number: String(fd.get("number") ?? ""),
          holder: String(fd.get("holder") ?? ""),
          exp: String(fd.get("exp") ?? ""),
          cvv: String(fd.get("cvv") ?? ""),
        },
      };
    } else {
      payload = {
        autopay: true,
        payment: {
          type: "ach",
          routing: String(fd.get("routing") ?? ""),
          account: String(fd.get("account") ?? ""),
          accountType:
            (fd.get("accountType") as "checking" | "savings") ?? "checking",
        },
      };
    }

    startTransition(async () => {
      const result = await savePayment(payload);
      if (result && !result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          const flat: FieldErrors = {};
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            if (v?.[0]) flat[k] = v[0];
          }
          setErrors(flat);
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-mahalo-navy-900">
              Autopay
            </span>
            <span className="text-sm text-muted-foreground">
              Save {formatUsd(savings)}/mo by enrolling in automatic payments.
            </span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <span className="text-muted-foreground">Off</span>
            <span className="relative inline-flex">
              <input
                type="checkbox"
                checked={autopay}
                onChange={(e) => setAutopay(e.target.checked)}
                className="peer sr-only"
                aria-label="Enable autopay"
              />
              <span
                aria-hidden
                className="block h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-mahalo-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50"
              />
              <span
                aria-hidden
                className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
              />
            </span>
            <span className="font-medium text-mahalo-navy-900">On</span>
          </label>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div
            className={cn(
              "rounded-lg border p-3",
              !autopay
                ? "border-mahalo-navy-900/20 bg-surface"
                : "border-border bg-background",
            )}
          >
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Standard
            </dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(monthlyStandard)}
              <span className="text-xs text-muted-foreground"> /mo</span>
            </dd>
          </div>
          <div
            className={cn(
              "rounded-lg border p-3",
              autopay
                ? "border-mahalo-blue-600/40 bg-surface"
                : "border-border bg-background",
            )}
          >
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              With autopay
            </dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(monthlyAutopay)}
              <span className="text-xs text-muted-foreground"> /mo</span>
            </dd>
          </div>
        </dl>
      </section>

      {autopay ? (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">
          <h2 className="text-base font-semibold text-mahalo-navy-900">
            Payment method
          </h2>
          <Tabs
            value={method}
            onValueChange={(v) => setMethod((v as Method) ?? "card")}
          >
            <TabsList>
              <TabsTrigger value="card">Card</TabsTrigger>
              <TabsTrigger value="ach">Bank (ACH)</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Card number"
                  id="card-number"
                  error={errors.number}
                  className="sm:col-span-2"
                >
                  <Input
                    id="card-number"
                    name="number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                  />
                </Field>
                <Field
                  label="Cardholder"
                  id="card-holder"
                  error={errors.holder}
                  className="sm:col-span-2"
                >
                  <Input
                    id="card-holder"
                    name="holder"
                    autoComplete="cc-name"
                    placeholder="Full name on card"
                  />
                </Field>
                <Field
                  label="Expiration (MM/YY)"
                  id="card-exp"
                  error={errors.exp}
                >
                  <Input
                    id="card-exp"
                    name="exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </Field>
                <Field label="CVV" id="card-cvv" error={errors.cvv}>
                  <Input
                    id="card-cvv"
                    name="cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    maxLength={4}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="ach" className="pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Routing number"
                  id="ach-routing"
                  error={errors.routing}
                >
                  <Input
                    id="ach-routing"
                    name="routing"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="9 digits"
                  />
                </Field>
                <Field
                  label="Account number"
                  id="ach-account"
                  error={errors.account}
                >
                  <Input
                    id="ach-account"
                    name="account"
                    inputMode="numeric"
                    maxLength={17}
                  />
                </Field>
                <fieldset className="sm:col-span-2 flex flex-col gap-2">
                  <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Account type
                  </legend>
                  <div className="flex gap-4">
                    {(["checking", "savings"] as const).map((value, idx) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 text-sm text-mahalo-navy-900"
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value={value}
                          defaultChecked={idx === 0}
                          className="size-4 cursor-pointer accent-mahalo-blue-600"
                        />
                        <span className="capitalize">{value}</span>
                      </label>
                    ))}
                  </div>
                  {errors.accountType ? (
                    <p className="text-xs text-destructive">{errors.accountType}</p>
                  ) : null}
                </fieldset>
              </div>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Your payment details are stored securely with the provider for
            recurring billing.
          </p>
        </section>
      ) : null}

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" render={<Link href="/checkout/customer" />}>
          Back
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  error,
  children,
  className,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
