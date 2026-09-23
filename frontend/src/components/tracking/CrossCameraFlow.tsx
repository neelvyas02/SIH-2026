import React from "react";
import type { Journey, JourneyHop } from "@/types";
import { Camera, ArrowRight, Clock, AlertTriangle, ShieldCheck, Footprints, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface CrossCameraFlowProps {
  journey: Journey;
  onInspectCamera?: (cameraId: string) => void;
}

export function CrossCameraFlow({ journey, onInspectCamera }: CrossCameraFlowProps) {
  const isPerson = journey.subjectType === "person";

  return (
    <div className="p-5 rounded-lg border border-border bg-card space-y-4 shadow-xs">
      {/* Top summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10 border border-primary/30 text-primary">
            {isPerson ? <Footprints className="w-4 h-4" /> : <Car className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-foreground">
              {journey.subjectType.toUpperCase()}: {journey.subjectId}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground block">
              Journey ID: {journey.id} · Total Track: {journey.distanceM} meters
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-semibold">
            {journey.hops.length} CAMERAS VISITED
          </span>
          {journey.incidentId && (
            <span className="px-2 py-0.5 rounded bg-high/20 text-high border border-high/30 font-bold">
              LINKED: {journey.incidentId}
            </span>
          )}
        </div>
      </div>

      {/* Visual Flow Pipeline */}
      <div className="relative overflow-x-auto py-2">
        <div className="flex items-center gap-3 min-w-[720px]">
          {journey.hops.map((hop, idx) => {
            const isCurrent = hop.cameraId === journey.currentCameraId;
            const isPredicted = idx === journey.hops.length - 1 && hop.alertIds.length === 0;
            const hasAlerts = hop.alertIds.length > 0;

            return (
              <React.Fragment key={hop.cameraId + idx}>
                {/* Camera Step Node */}
                <div
                  onClick={() => onInspectCamera?.(hop.cameraId)}
                  className={cn(
                    "flex-1 min-w-[170px] p-3 rounded-lg border cursor-pointer transition-all hover:scale-102 select-none",
                    isCurrent
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10 ring-1 ring-primary"
                      : isPredicted
                      ? "border-dashed border-border/80 bg-secondary/20 opacity-80"
                      : hasAlerts
                      ? "border-critical/50 bg-critical/5"
                      : "border-border bg-secondary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-primary" />
                      {hop.cameraId}
                    </span>
                    {isCurrent ? (
                      <span className="text-[9px] font-mono px-1 rounded bg-primary text-primary-foreground font-bold animate-pulse">
                        CURRENT
                      </span>
                    ) : isPredicted ? (
                      <span className="text-[9px] font-mono px-1 rounded bg-muted text-muted-foreground">
                        PREDICTED
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-muted-foreground">
                        HOP #{idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span>ENTER:</span>
                      <span className="font-semibold text-foreground">{hop.enter.split("T")[1]?.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>DWELL:</span>
                      <span className="text-foreground">{Math.round(hop.dwellSeconds / 60)}m {hop.dwellSeconds % 60}s</span>
                    </div>
                    <div className="text-[10px] text-primary truncate mt-1">
                      {hop.direction}
                    </div>
                  </div>

                  {hasAlerts && (
                    <div className="mt-2 text-[9px] font-mono text-critical font-bold truncate bg-critical/15 px-1 py-0.5 rounded border border-critical/30">
                      {hop.alertIds.join(", ")}
                    </div>
                  )}
                </div>

                {/* Arrow Connector */}
                {idx < journey.hops.length - 1 && (
                  <div className="flex flex-col items-center justify-center shrink-0 text-muted-foreground px-1">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-mono">NEXT</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
