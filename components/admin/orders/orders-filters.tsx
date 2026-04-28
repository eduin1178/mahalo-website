"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderStatusValues, type OrderStatus } from "@/lib/db/schema";

type ProviderOption = { id: string; name: string };

type Props = {
  providers: ProviderOption[];
  initial: {
    statuses: OrderStatus[];
    providerId: string;
    dateFrom: string;
    dateTo: string;
    search: string;
  };
};

export function OrdersFilters({ providers, initial }: Props) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<OrderStatus[]>(initial.statuses);
  const [providerId, setProviderId] = useState(initial.providerId);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [search, setSearch] = useState(initial.search);

  function toggleStatus(s: OrderStatus) {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    statuses.forEach((s) => params.append("status", s));
    if (providerId) params.set("provider", providerId);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (search.trim()) params.set("q", search.trim());
    router.push(`/admin/orders${params.size ? `?${params}` : ""}`);
  }

  function onReset() {
    setStatuses([]);
    setProviderId("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    router.push("/admin/orders");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border bg-white p-4"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs font-medium text-mahalo-navy-900">
          <span>Search</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email"
            className="h-9"
          />
        </label>

        <label className="space-y-1 text-xs font-medium text-mahalo-navy-900">
          <span>Provider</span>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">All providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-mahalo-navy-900">
          <span>Created from</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9"
          />
        </label>

        <label className="space-y-1 text-xs font-medium text-mahalo-navy-900">
          <span>Created to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9"
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-mahalo-navy-900">
          Status
        </legend>
        <div className="flex flex-wrap gap-2">
          {orderStatusValues.map((s) => {
            const active = statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "border-mahalo-navy-900 bg-mahalo-navy-900 text-white"
                    : "border-input bg-white text-muted-foreground hover:border-mahalo-blue-600 hover:text-mahalo-navy-900"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="solid" size="sm">
          Apply filters
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
