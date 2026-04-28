"use client";

import { useRouter } from "next/navigation";

import type { Provider } from "@/lib/db/schema";

type Props = {
  providers: Pick<Provider, "id" | "name" | "isActive">[];
  selectedId: string | null;
};

export function ProviderSelector({ providers, selectedId }: Props) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams();
    if (value) params.set("provider", value);
    router.push(`/admin/coverage${params.size ? `?${params}` : ""}`);
  }

  return (
    <select
      aria-label="Provider"
      value={selectedId ?? ""}
      onChange={onChange}
      className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <option value="">Select a provider…</option>
      {providers.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
          {p.isActive ? "" : " (inactive)"}
        </option>
      ))}
    </select>
  );
}
