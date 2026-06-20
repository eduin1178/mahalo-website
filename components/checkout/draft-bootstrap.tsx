"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createDraftOrder } from "@/lib/orders/draft-actions";

export function DraftBootstrap({ zip }: { zip: string | null }) {
  const router = useRouter();
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void (async () => {
      const result = await createDraftOrder({ zip: zip ?? undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/checkout/plan");
    })();
  }, [zip, router]);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Try another ZIP
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        aria-hidden
        className="size-3 animate-pulse rounded-full bg-mahalo-blue-600"
      />
      Getting everything ready…
    </div>
  );
}
