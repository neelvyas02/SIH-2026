import React from "react";
import type { Severity } from "@/types";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showIcon?: boolean;
}

export function SeverityBadge({ severity, className, showIcon = true }: SeverityBadgeProps) {
  const config = {
    CRITICAL: {
      bg: "bg-critical/15 text-critical border-critical/40",
      dot: "bg-critical animate-pulse",
      label: "CRITICAL",
    },
    HIGH: {
      bg: "bg-high/15 text-high border-high/40",
      dot: "bg-high",
      label: "HIGH",
    },
    MEDIUM: {
      bg: "bg-medium/15 text-medium border-medium/40",
      dot: "bg-medium",
      label: "MEDIUM",
    },
    LOW: {
      bg: "bg-low/15 text-low border-low/40",
      dot: "bg-low",
      label: "LOW",
    },
  }[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold tracking-wider uppercase font-mono shadow-xs",
        config.bg,
        className
      )}
    >
      {showIcon && <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />}
      {config.label}
    </span>
  );
}
