import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  variant?: "default" | "critical" | "high" | "online" | "info" | "warning";
  className?: string;
}

export function KpiCard({
  label,
  value,
  subValue,
  icon: Icon,
  variant = "default",
  className,
}: KpiCardProps) {
  const styles = {
    default: {
      border: "border-border/80",
      accent: "text-primary",
      bg: "bg-card",
      badge: "bg-primary/10 text-primary border-primary/30",
    },
    critical: {
      border: "border-critical/50",
      accent: "text-critical",
      bg: "bg-critical/5",
      badge: "bg-critical/15 text-critical border-critical/40",
    },
    high: {
      border: "border-high/50",
      accent: "text-high",
      bg: "bg-high/5",
      badge: "bg-high/15 text-high border-high/40",
    },
    online: {
      border: "border-online/40",
      accent: "text-online",
      bg: "bg-online/5",
      badge: "bg-online/15 text-online border-online/35",
    },
    info: {
      border: "border-info/40",
      accent: "text-info",
      bg: "bg-info/5",
      badge: "bg-info/15 text-info border-info/35",
    },
    warning: {
      border: "border-warning/40",
      accent: "text-warning",
      bg: "bg-warning/5",
      badge: "bg-warning/15 text-warning border-warning/35",
    },
  }[variant];

  return (
    <div
      className={cn(
        "p-3.5 rounded-lg border shadow-xs relative overflow-hidden flex flex-col justify-between transition-all hover:border-primary/40",
        styles.border,
        styles.bg,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold truncate">
          {label}
        </span>
        <div className={cn("p-1.5 rounded border shrink-0", styles.badge)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className={cn("text-2xl sm:text-3xl font-mono font-bold tracking-tight", styles.accent)}>
          {value}
        </span>
        {subValue && (
          <span className="text-[10px] font-mono text-muted-foreground ml-2 truncate">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
