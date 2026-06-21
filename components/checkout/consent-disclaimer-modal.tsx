"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PROVIDER_DISCLAIMER_PARAGRAPHS,
  providerDisclaimerHeading,
} from "@/lib/legal/consent";

type ConsentDisclaimerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
  pending: boolean;
  onContinue: () => void;
};

/**
 * Mandatory consent gate shown when advancing from plan/customize. The modal is
 * controlled by the parent; clicking "Continue" runs the gated server action and
 * constitutes the user's electronic signature (no separate checkbox).
 */
export function ConsentDisclaimerModal({
  open,
  onOpenChange,
  providerName,
  pending,
  onContinue,
}: ConsentDisclaimerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{providerDisclaimerHeading(providerName)}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto text-sm leading-relaxed text-muted-foreground">
          {PROVIDER_DISCLAIMER_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="primary"
            onClick={onContinue}
            disabled={pending}
          >
            {pending ? "Saving…" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
