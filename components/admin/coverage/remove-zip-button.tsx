"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { removeZip } from "@/lib/coverage/actions";

type Props = { providerId: string; zip: string };

export function RemoveZipButton({ providerId, zip }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const fd = new FormData();
    fd.set("providerId", providerId);
    fd.set("zip", zip);
    startTransition(async () => {
      await removeZip(fd);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "…" : "Remove"}
    </Button>
  );
}
