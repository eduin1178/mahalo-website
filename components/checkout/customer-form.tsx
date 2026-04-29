"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCustomerInfo } from "@/lib/orders/draft-actions";
import { phoneTypeValues, type PhoneType } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const addressFieldsSchema = z.object({
  line1: z.string().trim().min(1, "Required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Required").max(100),
  state: z.string().trim().length(2, "Use 2-letter state code"),
  zip: z.string().trim().regex(/^\d{5}$/u, "Enter a 5-digit ZIP"),
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
    billingAddress: addressFieldsSchema.partial(),
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
  });

type FormValues = z.input<typeof formSchema>;

export type CustomerFormInitialValues = {
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
};

type Props = {
  initial: CustomerFormInitialValues;
};

export function CustomerForm({ initial }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial,
    mode: "onBlur",
  });

  const useDifferentBilling = form.watch("useDifferentBilling");

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveCustomerInfo({
        ...values,
        billingAddress: values.useDifferentBilling
          ? (values.billingAddress as CustomerFormInitialValues["billingAddress"])
          : undefined,
      });
      if (result && !result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [name, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              form.setError(name as keyof FormValues, {
                type: "server",
                message: messages[0],
              });
            }
          }
        }
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold text-mahalo-navy-900">Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            id="firstName"
            error={errors.firstName?.message}
          >
            <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
          </Field>
          <Field
            label="Last name"
            id="lastName"
            error={errors.lastName?.message}
          >
            <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
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
                <span className="capitalize">{value}</span>
              </label>
            ))}
          </div>
          {errors.phoneType?.message ? (
            <p className="text-xs text-destructive">{errors.phoneType.message}</p>
          ) : null}
        </fieldset>
      </section>

      <AddressSection
        title="Installation address"
        prefix="installationAddress"
        register={form.register}
        errors={errors.installationAddress}
      />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">
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
              Toggle this if your bill goes somewhere else.
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
      </section>

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" render={<Link href="/checkout/summary" />}>
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

type AddressErrors = {
  line1?: { message?: string };
  line2?: { message?: string };
  city?: { message?: string };
  state?: { message?: string };
  zip?: { message?: string };
};

function AddressSection({
  title,
  prefix,
  register,
  errors,
  embedded,
}: {
  title: string;
  prefix: "installationAddress" | "billingAddress";
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors?: AddressErrors;
  embedded?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        !embedded && "rounded-xl border border-border bg-background p-5",
      )}
    >
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
        <Field label="City" id={`${prefix}.city`} error={errors?.city?.message}>
          <Input
            id={`${prefix}.city`}
            autoComplete="address-level2"
            {...register(`${prefix}.city` as const)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="State" id={`${prefix}.state`} error={errors?.state?.message}>
            <Input
              id={`${prefix}.state`}
              maxLength={2}
              autoComplete="address-level1"
              placeholder="CA"
              {...register(`${prefix}.state` as const)}
            />
          </Field>
          <Field label="ZIP" id={`${prefix}.zip`} error={errors?.zip?.message}>
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
