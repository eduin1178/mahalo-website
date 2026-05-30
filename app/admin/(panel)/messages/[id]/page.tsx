import Link from "next/link";
import { notFound } from "next/navigation";

import { MessageStatusActions } from "@/components/admin/messages/message-status-actions";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/clerk/require-role";
import { getContactMessage } from "@/lib/contact/queries";
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
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-mahalo-navy-900">{value}</dd>
    </div>
  );
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("agent");

  const { id } = await params;
  const message = await getContactMessage(id);
  if (!message) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/messages"
          className="text-sm text-mahalo-blue-600 underline-offset-2 hover:underline"
        >
          ← Back to messages
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-mahalo-navy-900">
            {message.firstName} {message.lastName}
          </h1>
          <Badge
            variant={STATUS_VARIANT[message.status]}
            className="capitalize"
          >
            {message.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Received {formatDate(message.createdAt)}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2">
        <Field label="Email" value={message.email} />
        <Field label="Phone" value={message.phone} />
        <Field label="ZIP code" value={message.zipCode} />
        <Field
          label="Consent"
          value={message.consent ? "Granted" : "Not granted"}
        />
      </dl>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Message
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-mahalo-navy-900">
          {message.message}
        </p>
      </div>

      <MessageStatusActions id={message.id} current={message.status} />
    </div>
  );
}
