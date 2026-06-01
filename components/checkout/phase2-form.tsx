"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { finalizePhase2 } from "@/lib/orders/draft-actions";
import { phoneTypeValues, type PhoneType } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const addressFieldsSchema = z.object({
  line1: z.string().trim().min(1, "Required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Required").max(100),
  state: z.string().trim().length(2, "Use the 2-letter code"),
  zip: z.string().trim().regex(/^\d{5}$/u, "Enter a 5-digit ZIP"),
});

const billingAddressLooseSchema = z.object({
  line1: z.string().max(200).optional().or(z.literal("")),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(40).optional().or(z.literal("")),
  zip: z.string().max(10).optional().or(z.literal("")),
});

const cardClientSchema = z.object({
  number: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/gu, ""))
    .pipe(z.string().regex(/^\d{13,19}$/u, "Enter a valid card number")),
  holder: z.string().trim().min(2, "Required").max(120),
  exp: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/u, "Use MM/YY"),
  cvv: z.string().trim().regex(/^\d{3,4}$/u, "Invalid CVV"),
});

const achClientSchema = z.object({
  routing: z.string().trim().regex(/^\d{9}$/u, "Routing must be 9 digits"),
  account: z.string().trim().regex(/^\d{4,17}$/u, "Invalid account number"),
  accountType: z.enum(["checking", "savings"]),
});

// Loose base schemas so empty default values never block submission.
// Strict validation happens in superRefine only when autopay is enabled.
const cardLooseSchema = z.object({
  number: z.string().max(40).optional().or(z.literal("")),
  holder: z.string().max(120).optional().or(z.literal("")),
  exp: z.string().max(5).optional().or(z.literal("")),
  cvv: z.string().max(4).optional().or(z.literal("")),
});

const achLooseSchema = z.object({
  routing: z.string().max(9).optional().or(z.literal("")),
  account: z.string().max(17).optional().or(z.literal("")),
  accountType: z.enum(["checking", "savings"]).optional(),
});

const formSchema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(80),
    lastName: z.string().trim().min(1, "Required").max(80),
    email: z.string().trim().email("Invalid email").max(254),
    phone: z
      .string()
      .trim()
      .min(7, "Invalid phone")
      .max(32)
      .regex(/^[\d\s().+-]+$/u, "Invalid phone"),
    phoneType: z.enum(phoneTypeValues),
    installationAddress: addressFieldsSchema,
    useDifferentBilling: z.boolean(),
    billingAddress: billingAddressLooseSchema,
    autopay: z.boolean(),
    paymentMethod: z.enum(["card", "ach"]),
    card: cardLooseSchema,
    ach: achLooseSchema,
  })
  .superRefine((v, ctx) => {
    if (v.useDifferentBilling) {
      const result = addressFieldsSchema.safeParse(v.billingAddress);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ["billingAddress", ...(issue.path as string[])],
          });
        }
      }
    }
    if (v.autopay) {
      if (v.paymentMethod === "card") {
        const result = cardClientSchema.safeParse(v.card);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ["card", ...(issue.path as string[])],
            });
          }
        }
      } else {
        const result = achClientSchema.safeParse(v.ach);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ["ach", ...(issue.path as string[])],
            });
          }
        }
      }
    }
  });

type FormValues = z.input<typeof formSchema>;

export type Phase2FormInitialValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneType: PhoneType;
  installationAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  useDifferentBilling: boolean;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  autopay: boolean;
  paymentMethod: "card" | "ach";
};

type Props = {
  initial: Phase2FormInitialValues;
  monthlyStandard: number;
  monthlyAutopay: number;
};

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const SECTION_IDS = {
  contact: "section-contacto",
  installation: "section-installation",
  billing: "section-billing",
  payment: "section-payment",
} as const;

function firstInvalidSection(
  errors: Record<string, unknown>,
): string | null {
  if (
    errors.firstName ||
    errors.lastName ||
    errors.email ||
    errors.phone ||
    errors.phoneType
  ) {
    return SECTION_IDS.contact;
  }
  if (errors.installationAddress) return SECTION_IDS.installation;
  if (errors.billingAddress) return SECTION_IDS.billing;
  if (errors.card || errors.ach) return SECTION_IDS.payment;
  return null;
}

export function Phase2Form({
  initial,
  monthlyStandard,
  monthlyAutopay,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initial,
      card: { number: "", holder: "", exp: "", cvv: "" },
      ach: { routing: "", account: "", accountType: "checking" },
    },
    mode: "onBlur",
  });

  const useDifferentBilling = form.watch("useDifferentBilling");
  const autopay = form.watch("autopay");
  const paymentMethod = form.watch("paymentMethod");

  const savings = Math.max(0, monthlyStandard - monthlyAutopay);

  function onSubmit(values: FormValues) {
    setServerError(null);

    const customerPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      phoneType: values.phoneType,
      installationAddress: values.installationAddress,
      useDifferentBilling: values.useDifferentBilling,
      billingAddress: values.useDifferentBilling
        ? (values.billingAddress as Phase2FormInitialValues["billingAddress"])
        : undefined,
    };

    const paymentPayload = (() => {
      if (!values.autopay) return { autopay: false as const };
      if (values.paymentMethod === "card") {
        return {
          autopay: true as const,
          payment: {
            type: "card" as const,
            number: values.card?.number ?? "",
            holder: values.card?.holder ?? "",
            exp: values.card?.exp ?? "",
            cvv: values.card?.cvv ?? "",
          },
        };
      }
      return {
        autopay: true as const,
        payment: {
          type: "ach" as const,
          routing: values.ach?.routing ?? "",
          account: values.ach?.account ?? "",
          accountType: values.ach?.accountType ?? "checking",
        },
      };
    })();

    startTransition(async () => {
      const result = await finalizePhase2({
        customer: customerPayload,
        payment: paymentPayload,
      });
      if (result && !result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [name, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              form.setError(name as never, {
                type: "server",
                message: messages[0],
              });
            }
          }
        }
        const targetId = firstInvalidSection(
          result.fieldErrors ?? {},
        );
        if (targetId) scrollToSection(targetId);
      }
    });
  }

  function onInvalid() {
    const targetId = firstInvalidSection(
      form.formState.errors as Record<string, unknown>,
    );
    if (targetId) scrollToSection(targetId);
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-6"
      noValidate
    >
      <SectionCard id={SECTION_IDS.contact}>
        <h2 className="text-base font-semibold text-mahalo-navy-900">
          Contact
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            id="firstName"
            error={errors.firstName?.message}
          >
            <Input
              id="firstName"
              autoComplete="given-name"
              {...form.register("firstName")}
            />
          </Field>
          <Field
            label="Last name"
            id="lastName"
            error={errors.lastName?.message}
          >
            <Input
              id="lastName"
              autoComplete="family-name"
              {...form.register("lastName")}
            />
          </Field>
          <Field label="Email" id="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
          </Field>
          <Field label="Phone" id="phone" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              {...form.register("phone")}
            />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Phone type
          </legend>
          <div className="flex gap-4">
            {phoneTypeValues.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-mahalo-navy-900"
              >
                <input
                  type="radio"
                  value={value}
                  className="size-4 cursor-pointer accent-mahalo-blue-600"
                  {...form.register("phoneType")}
                />
                <span className="capitalize">{translatePhoneType(value)}</span>
              </label>
            ))}
          </div>
          {errors.phoneType?.message ? (
            <p className="text-xs text-destructive">{errors.phoneType.message}</p>
          ) : null}
        </fieldset>
      </SectionCard>

      <AddressSection
        id={SECTION_IDS.installation}
        title="Installation address"
        prefix="installationAddress"
        register={form.register}
        errors={errors.installationAddress as never}
      />

      <SectionCard id={SECTION_IDS.billing}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 cursor-pointer accent-mahalo-blue-600"
            {...form.register("useDifferentBilling")}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-mahalo-navy-900">
              Use a different billing address
            </span>
            <span className="text-xs text-muted-foreground">
              Turn this on if the bill should go somewhere else.
            </span>
          </span>
        </label>

        {useDifferentBilling ? (
          <AddressSection
            title="Billing address"
            prefix="billingAddress"
            register={form.register}
            errors={errors.billingAddress as never}
            embedded
          />
        ) : null}
      </SectionCard>

      <SectionCard id={SECTION_IDS.payment}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-mahalo-navy-900">
              Autopay
            </span>
            <span className="text-sm text-muted-foreground">
              Save {formatUsd(savings)}/mo by enabling automatic payments.
            </span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <span className="text-muted-foreground">No</span>
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                aria-label="Enable autopay"
                {...form.register("autopay")}
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
            <span className="font-medium text-mahalo-navy-900">Yes</span>
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

        {autopay ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-mahalo-navy-900">
              Payment method
            </h3>
            <Tabs
              value={paymentMethod}
              onValueChange={(v) =>
                form.setValue("paymentMethod", (v as "card" | "ach") ?? "card")
              }
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
                    error={errors.card?.number?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="card-number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      {...form.register("card.number")}
                    />
                  </Field>
                  <Field
                    label="Cardholder"
                    id="card-holder"
                    error={errors.card?.holder?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="card-holder"
                      autoComplete="cc-name"
                      placeholder="Full name on the card"
                      {...form.register("card.holder")}
                    />
                  </Field>
                  <Field
                    label="Expiration (MM/YY)"
                    id="card-exp"
                    error={errors.card?.exp?.message}
                  >
                    <Input
                      id="card-exp"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      maxLength={5}
                      {...form.register("card.exp")}
                    />
                  </Field>
                  <Field
                    label="CVV"
                    id="card-cvv"
                    error={errors.card?.cvv?.message}
                  >
                    <Input
                      id="card-cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      maxLength={4}
                      {...form.register("card.cvv")}
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="ach" className="pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Routing number"
                    id="ach-routing"
                    error={errors.ach?.routing?.message}
                  >
                    <Input
                      id="ach-routing"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="9 digits"
                      {...form.register("ach.routing")}
                    />
                  </Field>
                  <Field
                    label="Account number"
                    id="ach-account"
                    error={errors.ach?.account?.message}
                  >
                    <Input
                      id="ach-account"
                      inputMode="numeric"
                      maxLength={17}
                      {...form.register("ach.account")}
                    />
                  </Field>
                  <fieldset className="sm:col-span-2 flex flex-col gap-2">
                    <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Account type
                    </legend>
                    <div className="flex gap-4">
                      {(["checking", "savings"] as const).map((value) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-2 text-sm text-mahalo-navy-900"
                        >
                          <input
                            type="radio"
                            value={value}
                            className="size-4 cursor-pointer accent-mahalo-blue-600"
                            {...form.register("ach.accountType")}
                          />
                          <span>
                            {value === "checking" ? "Checking" : "Savings"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              Your payment details are stored securely with the provider for
              recurring billing.
            </p>
          </div>
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
          disabled={pending}
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}

function scrollToSection(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function translatePhoneType(value: string): string {
  switch (value) {
    case "mobile":
      return "Mobile";
    case "home":
      return "Home";
    case "work":
      return "Work";
    default:
      return value;
  }
}

const SECTION_CARD_CLASS =
  "relative overflow-hidden rounded-3xl premium-light-card p-6 md:p-7 scroll-mt-24";

function SectionDecor() {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mahalo-cyan-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent"
        aria-hidden="true"
      />
    </>
  );
}

function SectionCard({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={SECTION_CARD_CLASS}>
      <SectionDecor />
      <div className="relative flex flex-col gap-4">{children}</div>
    </section>
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

type AddressErrors = {
  line1?: { message?: string };
  line2?: { message?: string };
  city?: { message?: string };
  state?: { message?: string };
  zip?: { message?: string };
};

function AddressSection({
  id,
  title,
  prefix,
  register,
  errors,
  embedded,
}: {
  id?: string;
  title: string;
  prefix: "installationAddress" | "billingAddress";
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors?: AddressErrors;
  embedded?: boolean;
}) {
  const body = (
    <>
      <h2 className="text-base font-semibold text-mahalo-navy-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Address line 1"
          id={`${prefix}.line1`}
          error={errors?.line1?.message}
          className="sm:col-span-2"
        >
          <Input
            id={`${prefix}.line1`}
            autoComplete="address-line1"
            {...register(`${prefix}.line1` as const)}
          />
        </Field>
        <Field
          label="Apt, suite (optional)"
          id={`${prefix}.line2`}
          error={errors?.line2?.message}
          className="sm:col-span-2"
        >
          <Input
            id={`${prefix}.line2`}
            autoComplete="address-line2"
            {...register(`${prefix}.line2` as const)}
          />
        </Field>
        <Field
          label="City"
          id={`${prefix}.city`}
          error={errors?.city?.message}
        >
          <Input
            id={`${prefix}.city`}
            autoComplete="address-level2"
            {...register(`${prefix}.city` as const)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="State"
            id={`${prefix}.state`}
            error={errors?.state?.message}
          >
            <Input
              id={`${prefix}.state`}
              maxLength={2}
              autoComplete="address-level1"
              placeholder="CA"
              {...register(`${prefix}.state` as const)}
            />
          </Field>
          <Field
            label="ZIP"
            id={`${prefix}.zip`}
            error={errors?.zip?.message}
          >
            <Input
              id={`${prefix}.zip`}
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
              {...register(`${prefix}.zip` as const)}
            />
          </Field>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <section className="flex flex-col gap-4 scroll-mt-24">{body}</section>
    );
  }

  return <SectionCard id={id}>{body}</SectionCard>;
}
