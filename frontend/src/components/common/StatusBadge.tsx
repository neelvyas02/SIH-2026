import React from "react";
import { cn } from "@/lib/utils";

export type OperationalStatus = "online" | "offline" | "degraded" | "warning" | "active" | "disabled" | "processing" | "idle";

interface StatusBadgeProps {
  status: OperationalStatus;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, className, size = "md" }: StatusBadgeProps) {
  const normalized = status.toLowerCase() as OperationalStatus;

  const config = {
    online: {
      bg: "bg-online/15 text-online border-online/35",
      dot: "bg-online shadow-[0_0_8px_var(--color-online)]",
      defaultLabel: "ONLINE",
    },
    active: {
      bg: "bg-online/15 text-online border-online/35",
      dot: "bg-online",
      defaultLabel: "ACTIVE",
    },
    processing: {
      bg: "bg-primary/15 text-primary border-primary/35",
      dot: "bg-primary animate-pulse",
      defaultLabel: "AI PROC",
    },
    degraded: {
      bg: "bg-warning/15 text-warning border-warning/35",
      dot: "bg-warning",
      defaultLabel: "DEGRADED",
    },
    warning: {
      bg: "bg-warning/15 text-warning border-warning/35",
      dot: "bg-warning",
      defaultLabel: "WARNING",
    },
    offline: {
      bg: "bg-offline/20 text-muted-foreground border-border",
      dot: "bg-offline",
      defaultLabel: "OFFLINE",
    },
    disabled: {
      bg: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground",
      defaultLabel: "DISABLED",
    },
    idle: {
      bg: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground",
      defaultLabel: "IDLE",
    },
  }[normalized] ?? {
    bg: "bg-muted text-foreground border-border",
    dot: "bg-muted-foreground",
    defaultLabel: status.toUpperCase(),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-mono font-medium uppercase tracking-wider",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        config.bg,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {label || config.defaultLabel}
    </span>
  );
}
