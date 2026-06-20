"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FieldError = string | null;

export type HeroSearchVariant = "hero" | "final-cta";

// Search is ZIP-only: returning an address-specific price is what triggers the
// FCC Broadband "nutrition" label obligation, so the search step never collects
// a street address. The installation address is collected later, in Details.
function classifyInput(raw: string):
  | { kind: "empty" }
  | { kind: "invalid-zip"; message: string }
  | { kind: "zip"; zip: string } {
  const value = raw.trim();
  if (!value) return { kind: "empty" };
  if (/^\d{5}$/u.test(value)) return { kind: "zip", zip: value };
  return { kind: "invalid-zip", message: "Enter a 5-digit ZIP code." };
}

interface HeroSearchProps {
  /**
   * "hero"      — white input on the dark navy hero (default)
   * "final-cta" — white input over the navy→cyan gradient Final CTA section
   */
  variant?: HeroSearchVariant;
  /** Unique suffix for aria-describedby IDs when the component appears more than once on the page. */
  idSuffix?: string;
}

export function HeroSearch({ variant = "hero", idSuffix = "" }: HeroSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [submitting, setSubmitting] = useState(false);

  // Submit handler is identical across variants — single source of truth.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = classifyInput(value);

    if (result.kind === "empty") {
      setError("Enter a 5-digit ZIP code to continue.");
      return;
    }
    if (result.kind === "invalid-zip") {
      setError(result.message);
      return;
    }

    setError(null);
    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("zip", result.zip);
    router.push(`/checkout?${params.toString()}`);
  };

  const errorId = `hero-search-error${idSuffix ? `-${idSuffix}` : ""}`;

  // Variant-specific class tokens. Both share the white bg / dark text input so
  // they are legible over any dark background (navy or navy→cyan gradient).
  const inputCls =
    variant === "hero"
      ? "h-14 rounded-xl border-2 border-white/20 bg-white pl-11 text-base font-medium text-mahalo-navy-900 shadow-md placeholder:text-mahalo-navy-900/40 hover:border-white/40 focus-visible:border-mahalo-cyan-500 focus-visible:ring-mahalo-cyan-500/40 sm:text-base"
      : "h-14 rounded-xl border-2 border-white/30 bg-white pl-11 text-base font-medium text-mahalo-navy-900 shadow-md placeholder:text-mahalo-navy-900/40 hover:border-white/50 focus-visible:border-mahalo-cyan-500 focus-visible:ring-mahalo-cyan-500/40 sm:text-base";

  const hintCls =
    variant === "hero"
      ? "mt-2 text-xs text-white/50"
      : "mt-2 text-xs text-white/60";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Check internet availability by ZIP code"
      className="w-full max-w-xl"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-mahalo-blue-600"
          />
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="Enter ZIP code"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={inputCls}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="h-14 px-6 text-sm font-semibold shadow-[0_8px_24px_rgba(11,31,77,0.18)] sm:px-7"
          disabled={submitting}
        >
          {submitting ? "Checking…" : "Check Availability"}
        </Button>
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-sm font-medium text-red-400"
        >
          {error}
        </p>
      ) : (
        <p className={hintCls}>
          We&apos;ll match you with providers serving your area in seconds.
        </p>
      )}
    </form>
  );
}
