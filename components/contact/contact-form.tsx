"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContact } from "@/lib/contact/actions";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(80),
  lastName: z.string().trim().min(1, "Required").max(80),
  zip: z.string().trim().regex(/^\d{5}$/u, "Enter a 5-digit ZIP"),
  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone")
    .max(32)
    .regex(/^[\d\s().+-]+$/u, "Invalid phone"),
  email: z.string().trim().email("Invalid email").max(254),
  message: z.string().trim().min(1, "Required").max(4000),
  consent: z.literal(true, {
    message: "You must accept the consent disclaimer to continue.",
  }),
  // Honeypot — hidden from humans. Accepted at the schema level; the server
  // action silently drops any submission where it is filled.
  company: z.string().optional(),
});

type FormValues = z.input<typeof formSchema>;

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ContactForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      zip: "",
      phone: "",
      email: "",
      message: "",
      consent: false as unknown as true,
      company: "",
    },
    mode: "onBlur",
  });

  const errors = form.formState.errors;

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await submitContact({
        firstName: values.firstName,
        lastName: values.lastName,
        zip: values.zip,
        phone: values.phone,
        email: values.email,
        message: values.message,
        consent: values.consent === true,
        company: values.company,
      });
      if (result.ok) {
        setSubmitted(true);
        form.reset();
        return;
      }
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
    });
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-background p-8 text-center"
      >
        <h2 className="text-xl font-semibold text-mahalo-navy-900">
          Thanks for reaching out
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We received your message and a real person will get back to you soon.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5 rounded-xl border border-border bg-background p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" id="firstName" error={errors.firstName?.message}>
          <Input
            id="firstName"
            autoComplete="given-name"
            {...form.register("firstName")}
          />
        </Field>
        <Field label="Last name" id="lastName" error={errors.lastName?.message}>
          <Input
            id="lastName"
            autoComplete="family-name"
            {...form.register("lastName")}
          />
        </Field>
        <Field label="ZIP code" id="zip" error={errors.zip?.message}>
          <Input
            id="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="74012"
            {...form.register("zip")}
          />
        </Field>
        <Field label="Phone number" id="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            {...form.register("phone")}
          />
        </Field>
      </div>

      <Field label="Email address" id="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
      </Field>

      <Field label="Message" id="message" error={errors.message?.message}>
        <textarea
          id="message"
          rows={5}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("message")}
        />
      </Field>

      {/* Honeypot: hidden from humans, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("company")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-mahalo-navy-900">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 cursor-pointer accent-mahalo-blue-600"
            {...form.register("consent")}
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            By submitting this form, you consent for Mahalo Enterprise and its
            authorized partners to contact you using automated technology,
            including texts, phone calls, prerecorded messages, and email, at the
            number and email provided about offers that may or may not relate to
            this specific inquiry. This consent is not required to make a
            purchase. Submitting this form constitutes your electronic signature.
          </span>
        </label>
        {errors.consent?.message ? (
          <p className="text-xs text-destructive">{errors.consent.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
}
