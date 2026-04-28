"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import { deleteSetting, setSetting } from "@/lib/settings/actions";

type CustomRow = { key: string; value: string; updatedAt: Date };

type Props = { rows: CustomRow[] };

export function CustomSettingsSection({ rows }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[1%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No custom settings yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => <CustomRowItem key={row.key} row={row} />)
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-mahalo-navy-900">
          Add custom setting
        </h3>
        <AddCustomForm />
      </div>
    </div>
  );
}

function CustomRowItem({ row }: { row: CustomRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(row.value);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSave() {
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("key", row.key);
    fd.set("value", value);
    startTransition(async () => {
      const result = await setSetting(fd);
      if (!result.ok) {
        setError(result.fieldErrors?.value?.[0] ?? result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Delete setting "${row.key}"?`)) return;
    setError(null);
    const fd = new FormData();
    fd.set("key", row.key);
    startTransition(async () => {
      const result = await deleteSetting(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-mahalo-navy-900">{row.key}</TableCell>
      <TableCell>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono"
        />
        {error ? (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        ) : saved ? (
          <p className="mt-1 text-xs text-mahalo-blue-600">Saved.</p>
        ) : null}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {row.updatedAt.toISOString().slice(0, 10)}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={pending || value === row.value}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={pending}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AddCustomForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function action(formData: FormData) {
    setErrors(null);
    setMessage(null);
    startTransition(async () => {
      const result = await setSetting(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? null);
        setMessage(result.error);
        return;
      }
      setMessage(`Saved "${result.data.key}".`);
      const formEl = document.getElementById(
        "add-custom-setting-form",
      ) as HTMLFormElement | null;
      formEl?.reset();
      router.refresh();
    });
  }

  return (
    <form
      id="add-custom-setting-form"
      action={action}
      className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="custom-key">Key</Label>
        <Input
          id="custom-key"
          name="key"
          required
          maxLength={80}
          pattern="^[a-z][a-z0-9_]{0,79}$"
          placeholder="custom_key"
          className="font-mono"
        />
        {errors?.key?.[0] ? (
          <p className="text-xs text-destructive">{errors.key[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="custom-value">Value</Label>
        <Input
          id="custom-value"
          name="value"
          maxLength={8192}
          className="font-mono"
        />
        {errors?.value?.[0] ? (
          <p className="text-xs text-destructive">{errors.value[0]}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? "Saving…" : "Add"}
        </Button>
      </div>
      {message ? (
        <p
          className={`sm:col-span-3 text-xs ${
            errors ? "text-destructive" : "text-mahalo-blue-600"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
