import React from "react";
import type { RiskAssessment } from "@/types";
import { Flame, ShieldAlert, Cpu, CheckCircle } from "lucide-react";
import { SeverityBadge } from "@/components/common/SeverityBadge";

interface RiskGaugeProps {
  risk: RiskAssessment;
}

export function RiskGauge({ risk }: RiskGaugeProps) {
  return (
    <div className="p-5 rounded-lg border border-high/50 bg-high/5 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-high" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Risk Evaluation Index
            </span>
          </div>
          <SeverityBadge severity={risk.level} />
        </div>

        {/* Big Meter Score */}
        <div className="flex items-baseline gap-2 my-2">
          <span className="text-4xl sm:text-5xl font-mono font-black text-high tracking-tight">
            {risk.score}
          </span>
          <span className="text-sm font-mono text-muted-foreground font-semibold">
            / 100 THREAT SCORE
          </span>
        </div>

        <p className="text-xs text-foreground mt-2 leading-relaxed font-mono">
          Assessment level <strong className="text-high uppercase">[{risk.level}]</strong> assigned due to continuous restricted zone breach, border-facing directional vector, and multi-camera re-identification.
        </p>
      </div>

      {/* Backend Engine Attribution Strip */}
      <div className="mt-4 pt-3 border-t border-high/30 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span>Source: {risk.source}</span>
        </div>
        <span>Model: {risk.modelVersion}</span>
      </div>
    </div>
  );
}
