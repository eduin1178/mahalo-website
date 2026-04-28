"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toggleProviderActive } from "@/lib/providers/actions";

export function ProviderActiveToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await toggleProviderActive(fd);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={isActive ? "destructive" : "secondary"}
      size="sm"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "…" : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
