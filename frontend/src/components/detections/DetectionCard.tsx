import React from "react";
import type { Detection } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Camera, Clock, User, Car, ScanFace, ScanLine, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

interface DetectionCardProps {
  detection: Detection;
  onInspectCamera?: (cameraId: string) => void;
}

export function DetectionCard({ detection, onInspectCamera }: DetectionCardProps) {
  const navigate = useNavigate();

  const getKindIcon = () => {
    switch (detection.kind) {
      case "human":
        return <User className="w-4 h-4 text-primary" />;
      case "vehicle":
        return <Car className="w-4 h-4 text-high" />;
      case "face":
        return <ScanFace className="w-4 h-4 text-info" />;
      case "anpr":
        return <ScanLine className="w-4 h-4 text-critical" />;
    }
  };

  return (
    <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-all group shadow-xs">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-secondary/70 border border-border shrink-0">
              {getKindIcon()}
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-foreground">
                {detection.subjectId || detection.plate || detection.id}
              </span>
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                {detection.kind} detection
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
            {Math.round(detection.confidence * 100)}% CONF
          </span>
        </div>

        {/* Optical Bounding Box Thumbnail Preview */}
        <div className="relative aspect-video w-full rounded bg-black/90 border border-border/70 overflow-hidden my-2 flex items-center justify-center select-none">
          {/* Synthetic CCTV Grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />

          {/* Bounding box representation */}
          <div
            className="absolute border border-primary bg-primary/20 flex flex-col justify-between p-1"
            style={{
              left: `${Math.max(10, detection.bbox.x * 0.7)}%`,
              top: `${Math.max(10, detection.bbox.y * 0.7)}%`,
              width: `${Math.min(70, detection.bbox.w * 0.9)}%`,
              height: `${Math.min(75, detection.bbox.h * 0.9)}%`,
            }}
          >
            <span className="text-[8px] font-mono text-white bg-primary px-1 rounded-xs w-fit">
              {detection.subjectId || detection.kind.toUpperCase()}
            </span>
          </div>

          <div className="absolute bottom-1 right-1 font-mono text-[9px] text-white/70 bg-black/60 px-1 rounded">
            {detection.positionLabel}
          </div>
        </div>

        {/* Meta details */}
        <div className="space-y-1 text-xs font-mono text-muted-foreground">
          {detection.vehicleClass && (
            <div className="flex items-center justify-between text-[11px]">
              <span>CLASS:</span>
              <span className="font-semibold text-foreground uppercase">{detection.vehicleClass}</span>
            </div>
          )}

          {detection.plate && (
            <div className="flex items-center justify-between text-[11px]">
              <span>PLATE:</span>
              <span className="font-bold text-primary">{detection.plate}</span>
            </div>
          )}

          {detection.faceMatch && (
            <div className="flex items-center justify-between text-[11px]">
              <span>AI MATCH VERDICT:</span>
              <span
                className={cn(
                  "font-bold uppercase px-1 rounded text-[10px]",
                  detection.faceMatch.status === "match"
                    ? "bg-critical/20 text-critical"
                    : "bg-online/20 text-online"
                )}
              >
                {detection.faceMatch.status === "match" ? "WATCHLIST MATCH" : "NO MATCH (AUTHORIZED)"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer link to camera stream & timestamp */}
      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
        <button
          onClick={() => onInspectCamera?.(detection.cameraId)}
          className="text-primary hover:underline flex items-center gap-1 font-semibold"
        >
          <Camera className="w-3 h-3" />
          <span>{detection.cameraId}</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>

        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          {detection.timestamp.split("T")[1]?.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
