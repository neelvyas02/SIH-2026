import React from "react";
import type { RiskFactor } from "@/types";
import { Check, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskFactorListProps {
  factors: RiskFactor[];
}

export function RiskFactorList({ factors }: RiskFactorListProps) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground block">
            Explainable AI Contributing Risk Factors
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Linear Factor Weighting Matrix · Transparent Backend Rationale
          </span>
        </div>
        <span className="text-xs font-mono text-primary font-semibold">
          {factors.filter((f) => f.present).length} / {factors.length} ACTIVE
        </span>
      </div>

      <div className="space-y-3">
        {factors.map((factor) => {
          return (
            <div
              key={factor.label}
              className={cn(
                "p-3 rounded-lg border transition-all",
                factor.present
                  ? "border-border/80 bg-secondary/30"
                  : "border-border/40 bg-muted/10 opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                      factor.present
                        ? "bg-high/20 text-high border border-high/40"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {factor.present ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {factor.label}
                  </span>
                </div>

                <span className="font-mono text-xs font-semibold text-primary">
                  +{factor.weight} PTS
                </span>
              </div>

              {/* Weight Contribution Progress Bar */}
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden my-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    factor.present ? "bg-high" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${Math.min(100, factor.weight * 3.5)}%` }}
                />
              </div>

              {/* Factual Evidence */}
              <div className="text-[11px] font-mono text-muted-foreground mt-1">
                <span className="text-foreground/80 font-medium">Evidence:</span> {factor.evidence}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
