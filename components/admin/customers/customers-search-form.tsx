"use client";

import { Input } from "@/components/ui/input";

type Props = {
  defaultValue: string;
};

export function CustomersSearchForm({ defaultValue }: Props) {
  return (
    <form method="get" action="/admin/customers" className="flex gap-2">
      <Input
        name="q"
        placeholder="Search name, email or phone"
        defaultValue={defaultValue}
        className="h-9 w-72"
      />
    </form>
  );
}
