"use client";

import { useState, useTransition } from "react";
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
  createAddOn,
  toggleAddOnActive,
  updateAddOn,
} from "@/lib/add-ons/actions";
import type { AddOn } from "@/lib/db/schema";

type Props = {
  providerId: string;
  addOns: AddOn[];
};

export function AddOnsSection({ providerId, addOns }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-mahalo-navy-900">
            Add-ons
          </h3>
          <p className="text-sm text-muted-foreground">
            Optional services this provider offers on top of a plan.
          </p>
        </div>
        <NewAddOnDialog providerId={providerId} />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addOns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No add-ons yet. Create the first one.
                </TableCell>
              </TableRow>
            ) : (
              addOns.map((addOn) => <AddOnRow key={addOn.id} addOn={addOn} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AddOnRow({ addOn }: { addOn: AddOn }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const fd = new FormData();
    fd.set("id", addOn.id);
    startTransition(async () => {
      await toggleAddOnActive(fd);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-mahalo-navy-900">
        {addOn.name}
      </TableCell>
      <TableCell className="max-w-md text-sm text-muted-foreground">
        {addOn.description ?? <span className="italic">—</span>}
      </TableCell>
      <TableCell>${Number(addOn.price).toFixed(2)}</TableCell>
      <TableCell>
        {addOn.isActive ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="space-x-2 whitespace-nowrap">
        <EditAddOnDialog addOn={addOn} />
        <Button
          type="button"
          variant={addOn.isActive ? "destructive" : "secondary"}
          size="sm"
          onClick={onToggle}
          disabled={pending}
        >
          {pending ? "…" : addOn.isActive ? "Deactivate" : "Activate"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NewAddOnDialog({ providerId }: { providerId: string }) {
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
      const result = await createAddOn(formData);
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
      <DialogTrigger render={<Button variant="solid">New add-on</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New add-on</DialogTitle>
          <DialogDescription>
            Add an optional service for this provider.
          </DialogDescription>
        </DialogHeader>
        <AddOnFormFields action={action} errors={errors} pending={pending} />
        {generalError ? (
          <p className="text-sm text-destructive">{generalError}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditAddOnDialog({ addOn }: { addOn: AddOn }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function action(formData: FormData) {
    setErrors(null);
    setGeneralError(null);
    formData.set("id", addOn.id);
    startTransition(async () => {
      const result = await updateAddOn(formData);
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
          <DialogTitle>Edit add-on</DialogTitle>
          <DialogDescription>{addOn.name}</DialogDescription>
        </DialogHeader>
        <AddOnFormFields
          action={action}
          errors={errors}
          pending={pending}
          initial={addOn}
        />
        {generalError ? (
          <p className="text-sm text-destructive">{generalError}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddOnFormFields({
  action,
  errors,
  pending,
  initial,
}: {
  action: (fd: FormData) => void;
  errors: Record<string, string[]> | null;
  pending: boolean;
  initial?: AddOn;
}) {
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="add-on-name">Name</Label>
        <Input
          id="add-on-name"
          name="name"
          defaultValue={initial?.name ?? ""}
          required
          maxLength={160}
        />
        {errors?.name?.[0] ? (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="add-on-price">Price</Label>
        <Input
          id="add-on-price"
          name="price"
          inputMode="decimal"
          placeholder="9.99"
          defaultValue={initial?.price ?? ""}
          required
        />
        {errors?.price?.[0] ? (
          <p className="text-xs text-destructive">{errors.price[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="add-on-description">Description</Label>
        <textarea
          id="add-on-description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          maxLength={500}
          className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Optional description shown to customers"
        />
        {errors?.description?.[0] ? (
          <p className="text-xs text-destructive">{errors.description[0]}</p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
