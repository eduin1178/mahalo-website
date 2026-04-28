"use client";

import { Input } from "@/components/ui/input";

type Props = {
  providerId: string;
  defaultValue: string;
};

export function CoverageSearchForm({ providerId, defaultValue }: Props) {
  return (
    <form method="get" action="/admin/coverage" className="flex gap-2">
      <input type="hidden" name="provider" value={providerId} />
      <Input
        name="search"
        placeholder="Search ZIPs (prefix)"
        defaultValue={defaultValue}
        inputMode="numeric"
        maxLength={5}
        className="h-9 w-48"
      />
    </form>
  );
}
