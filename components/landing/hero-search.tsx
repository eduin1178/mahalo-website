"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FieldError = string | null;

function classifyInput(raw: string):
  | { kind: "empty" }
  | { kind: "invalid-zip"; message: string }
  | { kind: "zip"; zip: string }
  | { kind: "address"; address: string } {
  const value = raw.trim();
  if (!value) return { kind: "empty" };

  if (/^\d+$/.test(value)) {
    if (value.length === 5) return { kind: "zip", zip: value };
    return {
      kind: "invalid-zip",
      message: "ZIP code must be exactly 5 digits.",
    };
  }

  if (value.length < 4) {
    return {
      kind: "invalid-zip",
      message: "Enter a 5-digit ZIP code or a full address.",
    };
  }

  return { kind: "address", address: value };
}

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = classifyInput(value);

    if (result.kind === "empty") {
      setError("Enter a ZIP code or address to continue.");
      return;
    }
    if (result.kind === "invalid-zip") {
      setError(result.message);
      return;
    }

    setError(null);
    setSubmitting(true);
    const params = new URLSearchParams();
    if (result.kind === "zip") {
      params.set("zip", result.zip);
    } else {
      params.set("address", result.address);
    }
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Check internet availability by ZIP code or address"
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
            inputMode="text"
            autoComplete="postal-code"
            placeholder="Enter ZIP code or address"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "hero-search-error" : undefined}
            className="h-14 rounded-xl border-2 border-mahalo-navy-900/15 bg-white pl-11 text-base font-medium text-mahalo-navy-900 shadow-md placeholder:text-muted-foreground/80 hover:border-mahalo-navy-900/25 focus-visible:border-mahalo-blue-600 focus-visible:ring-mahalo-cyan-500/40 sm:text-base"
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
          id="hero-search-error"
          role="alert"
          className="mt-2 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          We&apos;ll match you with providers serving your area in seconds.
        </p>
      )}
    </form>
  );
}
