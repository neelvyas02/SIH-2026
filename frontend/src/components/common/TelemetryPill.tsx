import React from "react";
import { cn } from "@/lib/utils";

interface TelemetryPillProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function TelemetryPill({
  label,
  value,
  unit,
  variant = "default",
  className,
}: TelemetryPillProps) {
  const variantStyles = {
    default: "border-border/60 bg-muted/30 text-foreground",
    success: "border-online/30 bg-online/10 text-online",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-critical/30 bg-critical/10 text-critical",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[11px]",
        variantStyles,
        className
      )}
    >
      <span className="text-muted-foreground text-[10px] uppercase">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
      {unit && <span className="text-muted-foreground text-[10px]">{unit}</span>}
    </div>
  );
}
