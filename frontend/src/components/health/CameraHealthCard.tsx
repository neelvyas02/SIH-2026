import React from "react";
import type { Camera } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TelemetryPill } from "@/components/common/TelemetryPill";
import {
  Activity,
  Camera as CameraIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  EyeOff,
  RotateCw,
  Radio,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraHealthCardProps {
  camera: Camera;
  onInspect: (camera: Camera) => void;
}

export function CameraHealthCard({ camera, onInspect }: CameraHealthCardProps) {
  const isOffline = camera.status === "offline";
  const isDegraded = camera.status === "degraded" || camera.health.fps < 20;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs",
        isOffline
          ? "border-critical/40 bg-critical/5"
          : isDegraded
          ? "border-warning/40 bg-warning/5"
          : "border-border"
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">
              {camera.id}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {camera.name}
            </span>
          </div>
          <StatusBadge status={camera.status} size="sm" />
        </div>

        <p className="text-[11px] font-mono text-muted-foreground truncate mb-3">
          {camera.location} · Sector WEST-9
        </p>

        {/* Telemetry Matrix Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">STREAM FPS:</span>
            <span
              className={cn(
                "font-bold text-sm",
                camera.health.fps < 20 ? "text-warning" : "text-online"
              )}
            >
              {camera.health.fps} / {camera.health.targetFps} FPS
            </span>
          </div>

          <div className="p-2 rounded bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">LATENCY:</span>
            <span className="font-bold text-sm text-foreground">
              {camera.health.latencyMs} ms
            </span>
          </div>

          <div className="p-2 rounded bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">7-DAY UPTIME:</span>
            <span className="font-bold text-sm text-online">
              {camera.health.uptime7d}%
            </span>
          </div>

          <div className="p-2 rounded bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">FAILURES (24H):</span>
            <span
              className={cn(
                "font-bold text-sm",
                camera.health.streamFailures24h > 0 ? "text-critical" : "text-foreground"
              )}
            >
              {camera.health.streamFailures24h} events
            </span>
          </div>
        </div>

        {/* Hardware Sensor Fault Flags */}
        <div className="mt-3 space-y-1 text-[11px] font-mono">
          {camera.health.blur && (
            <div className="flex items-center gap-1.5 text-warning font-semibold p-1.5 rounded bg-warning/10 border border-warning/20">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Optical blur / lens degradation detected</span>
            </div>
          )}
          {camera.health.obstruction && (
            <div className="flex items-center gap-1.5 text-critical font-semibold p-1.5 rounded bg-critical/10 border border-critical/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Physical obstruction / camouflage flagged</span>
            </div>
          )}
          {camera.health.angleChanged && (
            <div className="flex items-center gap-1.5 text-warning font-semibold p-1.5 rounded bg-warning/10 border border-warning/20">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Mount angle drift / tamper warning</span>
            </div>
          )}
          {!camera.health.blur && !camera.health.obstruction && !camera.health.angleChanged && (
            <div className="flex items-center gap-1.5 text-online text-[10px] pt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Sensor optics, mount angle &amp; housing verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Details & Inspection */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-primary" />
          Heartbeat: {camera.health.lastHeartbeat.split("T")[1]?.slice(0, 8)}
        </span>
        <button
          onClick={() => onInspect(camera)}
          className="text-primary hover:underline font-semibold flex items-center gap-1"
        >
          <span>Diagnostic Terminal</span>
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
