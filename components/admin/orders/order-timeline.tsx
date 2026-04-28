import { StatusBadge } from "@/components/brand/StatusBadge";
import type { OrderStatusHistoryRow } from "@/lib/db/schema";

function formatTimestamp(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function OrderTimeline({ history }: { history: OrderStatusHistoryRow[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No status changes recorded yet.
      </p>
    );
  }

  const ordered = [...history].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {ordered.map((row) => (
        <li key={row.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-mahalo-blue-600 ring-4 ring-white"
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={row.status} />
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(row.createdAt)}
            </span>
            {row.changedBy ? (
              <span className="text-xs font-mono text-muted-foreground">
                by {row.changedBy.slice(0, 12)}
              </span>
            ) : null}
          </div>
          {row.notes ? (
            <p className="mt-1 text-sm text-mahalo-navy-900 whitespace-pre-wrap">
              {row.notes}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
