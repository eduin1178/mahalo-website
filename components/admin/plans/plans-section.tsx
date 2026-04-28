"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  createPlan,
  reorderPlans,
  togglePlanActive,
  updatePlan,
} from "@/lib/plans/actions";
import type { Plan } from "@/lib/db/schema";

type Props = {
  providerId: string;
  plans: Plan[];
};

export function PlansSection({ providerId, plans }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-mahalo-navy-900">
            Plans
          </h3>
          <p className="text-sm text-muted-foreground">
            Pricing tiers offered by this provider. Lower sort order shows
            first.
          </p>
        </div>
        <NewPlanDialog providerId={providerId} />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Autopay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No plans yet. Create the first one.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)
            )}
          </TableBody>
        </Table>
      </div>

      {plans.length > 1 ? (
        <ReorderHint providerId={providerId} plans={plans} />
      ) : null}
    </div>
  );
}

function PlanRow({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const fd = new FormData();
    fd.set("id", plan.id);
    startTransition(async () => {
      await togglePlanActive(fd);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{plan.sortOrder}</TableCell>
      <TableCell className="font-medium text-mahalo-navy-900">
        {plan.name}
      </TableCell>
      <TableCell>{plan.speed}</TableCell>
      <TableCell>${Number(plan.priceStandard).toFixed(2)}</TableCell>
      <TableCell>${Number(plan.priceAutopay).toFixed(2)}</TableCell>
      <TableCell>
        {plan.isActive ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="space-x-2 whitespace-nowrap">
        <EditPlanDialog plan={plan} />
        <Button
          type="button"
          variant={plan.isActive ? "destructive" : "secondary"}
          size="sm"
          onClick={onToggle}
          disabled={pending}
        >
          {pending ? "…" : plan.isActive ? "Deactivate" : "Activate"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NewPlanDialog({ providerId }: { providerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function action(formData: FormData) {
    setErrors(null);
    setGeneralError(null);
    formData.set("providerId", providerId);
    startTransition(async () => {
      const result = await createPlan(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? null);
        setGeneralError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="solid">New plan</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New plan</DialogTitle>
          <DialogDescription>
            Add a pricing tier for this provider.
          </DialogDescription>
        </DialogHeader>
        <PlanFormFields action={action} errors={errors} pending={pending} />
        {generalError ? (
          <p className="text-sm text-destructive">{generalError}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditPlanDialog({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function action(formData: FormData) {
    setErrors(null);
    setGeneralError(null);
    formData.set("id", plan.id);
    startTransition(async () => {
      const result = await updatePlan(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? null);
        setGeneralError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit plan</DialogTitle>
          <DialogDescription>{plan.name}</DialogDescription>
        </DialogHeader>
        <PlanFormFields
          action={action}
          errors={errors}
          pending={pending}
          initial={plan}
        />
        {generalError ? (
          <p className="text-sm text-destructive">{generalError}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PlanFormFields({
  action,
  errors,
  pending,
  initial,
}: {
  action: (fd: FormData) => void;
  errors: Record<string, string[]> | null;
  pending: boolean;
  initial?: Plan;
}) {
  const featuresText = useMemo(
    () => (initial?.features ?? []).join("\n"),
    [initial],
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="plan-name">Name</Label>
        <Input
          id="plan-name"
          name="name"
          defaultValue={initial?.name ?? ""}
          required
          maxLength={160}
        />
        {errors?.name?.[0] ? (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="plan-speed">Speed</Label>
          <Input
            id="plan-speed"
            name="speed"
            defaultValue={initial?.speed ?? ""}
            placeholder="500 Mbps"
            required
            maxLength={64}
          />
          {errors?.speed?.[0] ? (
            <p className="text-xs text-destructive">{errors.speed[0]}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="plan-sort">Sort order</Label>
          <Input
            id="plan-sort"
            type="number"
            min={0}
            max={999}
            step={1}
            name="sortOrder"
            defaultValue={initial?.sortOrder ?? 0}
            required
          />
          {errors?.sortOrder?.[0] ? (
            <p className="text-xs text-destructive">{errors.sortOrder[0]}</p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="plan-price">Price (standard)</Label>
          <Input
            id="plan-price"
            name="priceStandard"
            inputMode="decimal"
            placeholder="49.99"
            defaultValue={initial?.priceStandard ?? ""}
            required
          />
          {errors?.priceStandard?.[0] ? (
            <p className="text-xs text-destructive">
              {errors.priceStandard[0]}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="plan-autopay">Price (autopay)</Label>
          <Input
            id="plan-autopay"
            name="priceAutopay"
            inputMode="decimal"
            placeholder="44.99"
            defaultValue={initial?.priceAutopay ?? ""}
            required
          />
          {errors?.priceAutopay?.[0] ? (
            <p className="text-xs text-destructive">
              {errors.priceAutopay[0]}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="plan-features">Features (one per line)</Label>
        <textarea
          id="plan-features"
          name="features"
          rows={4}
          defaultValue={featuresText}
          className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder={"Unlimited data\nFree installation"}
        />
      </div>
      <DialogFooter>
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ReorderHint({
  providerId,
  plans,
}: {
  providerId: string;
  plans: Plan[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<string, number>>(() =>
    Object.fromEntries(plans.map((p) => [p.id, p.sortOrder])),
  );
  const [message, setMessage] = useState<string | null>(null);

  const dirty = plans.some((p) => draft[p.id] !== p.sortOrder);

  function save() {
    setMessage(null);
    const orders = plans.map((p) => ({
      id: p.id,
      sortOrder: Number(draft[p.id] ?? p.sortOrder),
    }));
    startTransition(async () => {
      const result = await reorderPlans({ providerId, orders });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Order saved.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="mb-3 text-sm font-medium text-mahalo-navy-900">
        Quick reorder
      </p>
      <div className="grid gap-2">
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={999}
              step={1}
              value={draft[p.id] ?? p.sortOrder}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  [p.id]: Number(e.target.value),
                }))
              }
              className="w-20"
            />
            <span className="text-sm text-mahalo-navy-900">{p.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          variant="solid"
          size="sm"
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : "Save order"}
        </Button>
        {message ? (
          <span className="text-sm text-mahalo-blue-600">{message}</span>
        ) : null}
      </div>
    </div>
  );
}
