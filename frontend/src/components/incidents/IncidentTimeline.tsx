import React from "react";
import type { IncidentEvent } from "@/types";
import {
  User,
  AlertTriangle,
  Compass,
  Flame,
  ShieldCheck,
  FolderArchive,
  Camera,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IncidentTimelineProps {
  events: IncidentEvent[];
  onInspectCamera?: (cameraId: string) => void;
}

export function IncidentTimeline({ events, onInspectCamera }: IncidentTimelineProps) {
  const getEventIcon = (kind: IncidentEvent["kind"]) => {
    switch (kind) {
      case "detection":
        return <User className="w-4 h-4 text-primary" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-critical" />;
      case "movement":
        return <Compass className="w-4 h-4 text-info" />;
      case "risk":
        return <Flame className="w-4 h-4 text-high" />;
      case "action":
        return <ShieldCheck className="w-4 h-4 text-online" />;
      case "evidence":
        return <FolderArchive className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventBadge = (kind: IncidentEvent["kind"]) => {
    switch (kind) {
      case "detection":
        return "bg-primary/15 text-primary border-primary/30";
      case "alert":
        return "bg-critical/15 text-critical border-critical/30";
      case "movement":
        return "bg-info/15 text-info border-info/30";
      case "risk":
        return "bg-high/15 text-high border-high/30";
      case "action":
        return "bg-online/15 text-online border-online/30";
      case "evidence":
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
      {events.map((ev, idx) => {
        return (
          <div key={ev.timestamp + idx} className="relative group">
            {/* Bullet icon */}
            <span className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-card border-2 border-primary flex items-center justify-center text-[8px] font-mono font-bold text-foreground">
              {idx + 1}
            </span>

            <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-secondary/80 border border-border">
                    {getEventIcon(ev.kind)}
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {ev.title}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold",
                      getEventBadge(ev.kind)
                    )}
                  >
                    {ev.kind}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                  {ev.cameraId && (
                    <button
                      onClick={() => onInspectCamera?.(ev.cameraId!)}
                      className="text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{ev.cameraId}</span>
                    </button>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {ev.timestamp.split("T")[1]?.slice(0, 8)} IST
                  </span>
                </div>
              </div>

              <p className="text-xs text-foreground/90 font-mono leading-relaxed pl-7">
                {ev.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
