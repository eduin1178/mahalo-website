import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/clerk/require-role";
import { listContactMessages } from "@/lib/contact/queries";
import type { ContactMessageStatus } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  ContactMessageStatus,
  "default" | "secondary" | "outline"
> = {
  new: "default",
  read: "secondary",
  archived: "outline",
};

function formatDate(d: Date): string {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MessagesPage() {
  await requireRole("agent");

  const rows = await listContactMessages();
  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mahalo-blue-600">
          Operations
        </p>
        <h1 className="text-3xl font-bold text-mahalo-navy-900">Messages</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} contact message{rows.length === 1 ? "" : "s"}
          {newCount > 0 ? ` · ${newCount} new` : ""}.
        </p>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>ZIP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No messages yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/admin/messages/${row.id}`}
                      className="text-mahalo-navy-900 underline-offset-2 hover:underline"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.email}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.zipCode}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[row.status]}
                      className="capitalize"
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
