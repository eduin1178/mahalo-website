import { cn } from "@/lib/utils"

export type OrderStatus =
  | "Draft"
  | "Pending"
  | "Created"
  | "Scheduled"
  | "Installed"
  | "Completed"
  | "Cancelled"

const STATUS_STYLES: Record<OrderStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-warning/12 text-warning",
  Created: "bg-info/12 text-info",
  Scheduled: "bg-purple/12 text-purple",
  Installed: "bg-mahalo-cyan-500/15 text-mahalo-navy-900",
  Completed: "bg-success/12 text-success",
  Cancelled: "bg-destructive/12 text-destructive",
}

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
