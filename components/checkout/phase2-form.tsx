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
  line1: z.string().trim().min(1, "Obligatorio").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Obligatorio").max(100),
  state: z.string().trim().length(2, "Usa el código de 2 letras"),
  zip: z.string().trim().regex(/^\d{5}$/u, "Ingresa un ZIP de 5 dígitos"),
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
    .pipe(z.string().regex(/^\d{13,19}$/u, "Ingresa un número de tarjeta válido")),
  holder: z.string().trim().min(2, "Obligatorio").max(120),
  exp: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/u, "Usa MM/AA"),
  cvv: z.string().trim().regex(/^\d{3,4}$/u, "CVV inválido"),
});

const achClientSchema = z.object({
  routing: z.string().trim().regex(/^\d{9}$/u, "El routing debe tener 9 dígitos"),
  account: z.string().trim().regex(/^\d{4,17}$/u, "Número de cuenta inválido"),
  accountType: z.enum(["checking", "savings"]),
});

const formSchema = z
  .object({
    firstName: z.string().trim().min(1, "Obligatorio").max(80),
    lastName: z.string().trim().min(1, "Obligatorio").max(80),
    email: z.string().trim().email("Correo inválido").max(254),
    phone: z
      .string()
      .trim()
      .min(7, "Teléfono inválido")
      .max(32)
      .regex(/^[\d\s().+-]+$/u, "Teléfono inválido"),
    phoneType: z.enum(phoneTypeValues),
    installationAddress: addressFieldsSchema,
    useDifferentBilling: z.boolean(),
    billingAddress: billingAddressLooseSchema,
    autopay: z.boolean(),
    paymentMethod: z.enum(["card", "ach"]),
    card: cardClientSchema.partial(),
    ach: achClientSchema.partial(),
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
      <section
        id={SECTION_IDS.contact}
        className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 scroll-mt-24"
      >
        <h2 className="text-base font-semibold text-mahalo-navy-900">
          Contacto
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Nombre"
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
            label="Apellido"
            id="lastName"
            error={errors.lastName?.message}
          >
            <Input
              id="lastName"
              autoComplete="family-name"
              {...form.register("lastName")}
            />
          </Field>
          <Field label="Correo" id="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
          </Field>
          <Field label="Teléfono" id="phone" error={errors.phone?.message}>
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
            Tipo de teléfono
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
      </section>

      <AddressSection
        id={SECTION_IDS.installation}
        title="Dirección de instalación"
        prefix="installationAddress"
        register={form.register}
        errors={errors.installationAddress as never}
      />

      <section
        id={SECTION_IDS.billing}
        className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 scroll-mt-24"
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 cursor-pointer accent-mahalo-blue-600"
            {...form.register("useDifferentBilling")}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-mahalo-navy-900">
              Usar una dirección de facturación distinta
            </span>
            <span className="text-xs text-muted-foreground">
              Actívalo si la factura debe ir a otro lugar.
            </span>
          </span>
        </label>

        {useDifferentBilling ? (
          <AddressSection
            title="Dirección de facturación"
            prefix="billingAddress"
            register={form.register}
            errors={errors.billingAddress as never}
            embedded
          />
        ) : null}
      </section>

      <section
        id={SECTION_IDS.payment}
        className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 scroll-mt-24"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-mahalo-navy-900">
              Pago automático
            </span>
            <span className="text-sm text-muted-foreground">
              Ahorra {formatUsd(savings)}/mes activando el cargo automático.
            </span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <span className="text-muted-foreground">No</span>
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                aria-label="Activar pago automático"
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
            <span className="font-medium text-mahalo-navy-900">Sí</span>
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
              Estándar
            </dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(monthlyStandard)}
              <span className="text-xs text-muted-foreground"> /mes</span>
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
              Con pago automático
            </dt>
            <dd className="text-mahalo-navy-900">
              {formatUsd(monthlyAutopay)}
              <span className="text-xs text-muted-foreground"> /mes</span>
            </dd>
          </div>
        </dl>

        {autopay ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-mahalo-navy-900">
              Método de pago
            </h3>
            <Tabs
              value={paymentMethod}
              onValueChange={(v) =>
                form.setValue("paymentMethod", (v as "card" | "ach") ?? "card")
              }
            >
              <TabsList>
                <TabsTrigger value="card">Tarjeta</TabsTrigger>
                <TabsTrigger value="ach">Banco (ACH)</TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Número de tarjeta"
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
                    label="Titular"
                    id="card-holder"
                    error={errors.card?.holder?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="card-holder"
                      autoComplete="cc-name"
                      placeholder="Nombre completo en la tarjeta"
                      {...form.register("card.holder")}
                    />
                  </Field>
                  <Field
                    label="Vencimiento (MM/AA)"
                    id="card-exp"
                    error={errors.card?.exp?.message}
                  >
                    <Input
                      id="card-exp"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
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
                    label="Número de routing"
                    id="ach-routing"
                    error={errors.ach?.routing?.message}
                  >
                    <Input
                      id="ach-routing"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="9 dígitos"
                      {...form.register("ach.routing")}
                    />
                  </Field>
                  <Field
                    label="Número de cuenta"
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
                      Tipo de cuenta
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
                            {value === "checking" ? "Corriente" : "Ahorros"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              Tus datos de pago se guardan de forma segura con el proveedor para
              el cobro recurrente.
            </p>
          </div>
        ) : null}
      </section>

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Guardando…" : "Continuar"}
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
      return "Celular";
    case "home":
      return "Casa";
    case "work":
      return "Trabajo";
    default:
      return value;
  }
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
  return (
    <section
      id={id}
      className={cn(
        "flex flex-col gap-4 scroll-mt-24",
        !embedded && "rounded-xl border border-border bg-background p-5",
      )}
    >
      <h2 className="text-base font-semibold text-mahalo-navy-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Línea 1"
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
          label="Apto, suite (opcional)"
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
          label="Ciudad"
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
            label="Estado"
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
    </section>
  );
}
