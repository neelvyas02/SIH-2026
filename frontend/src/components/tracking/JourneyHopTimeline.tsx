import React from "react";
import type { JourneyHop } from "@/types";
import { Camera, Clock, ArrowRight, Bell, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyHopTimelineProps {
  hops: JourneyHop[];
  onInspectCamera?: (cameraId: string) => void;
}

export function JourneyHopTimeline({ hops, onInspectCamera }: JourneyHopTimelineProps) {
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return mins > 0 ? `${mins}m ${s}s` : `${s}s`;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
      {hops.map((hop, idx) => {
        const isLast = idx === hops.length - 1;
        const hasAlerts = hop.alertIds.length > 0;

        return (
          <div key={hop.cameraId + idx} className="relative group">
            {/* Timeline bullet */}
            <span
              className={cn(
                "absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center transition-all",
                hasAlerts ? "bg-critical ring-2 ring-critical/40" : "bg-primary"
              )}
            />

            <div className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onInspectCamera?.(hop.cameraId)}
                    className="font-mono text-sm font-bold text-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    <span>{hop.cameraId}</span>
                  </button>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    HOP #{idx + 1}
                  </span>
                  {hasAlerts && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-critical/20 text-critical border border-critical/30 font-bold">
                      {hop.alertIds.join(", ")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {hop.enter.split("T")[1]?.slice(0, 8)} ➔ {hop.exit.split("T")[1]?.slice(0, 8)}
                  </span>
                  <span className="text-foreground font-semibold">
                    (Dwell: {formatDuration(hop.dwellSeconds)})
                  </span>
                </div>
              </div>

              {/* Movement Vector */}
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1">
                <span className="text-foreground font-medium">Trajectory:</span>
                <span className="text-primary font-bold">{hop.direction}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
