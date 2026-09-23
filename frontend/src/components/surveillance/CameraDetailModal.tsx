import React, { useState } from "react";
import type { Camera, Detection } from "@/types";
import { CameraFeedCanvas } from "@/components/surveillance/CameraFeedCanvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { TelemetryPill } from "@/components/common/TelemetryPill";
import {
  Camera as CameraIcon,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface CameraDetailModalProps {
  camera: Camera | null;
  detections?: Detection[];
  open: boolean;
  onClose: () => void;
}

export function CameraDetailModal({
  camera,
  detections = [],
  open,
  onClose,
}: CameraDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [ptzAction, setPtzAction] = useState<string | null>(null);

  if (!camera) return null;

  const handleSnapshot = () => {
    toast.success(`Optical snapshot captured for ${camera.id}`, {
      description: `Saved to memory vault under ${camera.id}_${Date.now()}.png`,
    });
  };

  const handlePtz = (direction: string) => {
    setPtzAction(`PTZ: ${direction}`);
    setTimeout(() => setPtzAction(null), 1200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl bg-card border-border p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <CameraIcon className="w-5 h-5 text-primary" />
              <span>{camera.id} · {camera.name}</span>
            </DialogTitle>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {camera.location} · Sector WEST-9 · Bearing: {camera.bearing}°
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={camera.status} />
            <StatusBadge status={camera.aiStatus} label={`AI: ${camera.aiStatus}`} />
          </div>
        </DialogHeader>

        {/* Video Stage */}
        <div className="mt-3 relative rounded-lg overflow-hidden border border-border bg-black">
          <CameraFeedCanvas
            camera={camera}
            detections={detections}
            isPlaying={isPlaying}
            zoomLevel={zoomLevel}
          />
          {ptzAction && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-mono text-xs px-3 py-1 rounded shadow-lg animate-pulse">
              {ptzAction}
            </div>
          )}
        </div>

        {/* Tactical Control Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2 rounded-md bg-secondary/40 border border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded hover:bg-muted text-foreground transition-colors"
              title={isPlaying ? "Pause Stream" : "Play Stream"}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-warning" /> : <Play className="w-4 h-4 text-online" />}
            </button>
            <button
              onClick={handleSnapshot}
              className="p-1.5 rounded hover:bg-muted text-foreground transition-colors"
              title="Capture Snapshot"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded hover:bg-muted text-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1.5 rounded hover:bg-muted text-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {zoomLevel > 1 && (
              <span className="text-[10px] font-mono text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10">
                {zoomLevel.toFixed(2)}x
              </span>
            )}
          </div>

          {/* Telemetry Pills */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <TelemetryPill label="FPS" value={camera.health.fps} unit="/25" />
            <TelemetryPill label="Latency" value={camera.health.latencyMs} unit="ms" />
            <TelemetryPill label="Uptime" value={`${camera.health.uptime7d}%`} variant="success" />
            <TelemetryPill label="Persons" value={camera.personCount} />
            <TelemetryPill label="Vehicles" value={camera.vehicleCount} />
          </div>
        </div>

        {/* Lower Grid: PTZ Controller & Diagnostic Specs */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PTZ Console */}
          <div className="p-3 rounded-md border border-border bg-card">
            <span className="text-xs font-mono uppercase text-muted-foreground font-semibold block mb-2">
              Virtual Pan-Tilt-Zoom (PTZ) Console
            </span>
            <div className="flex flex-col items-center justify-center p-3 bg-secondary/20 rounded border border-border/60">
              <button
                onClick={() => handlePtz("Tilt UP")}
                className="p-2 rounded hover:bg-secondary text-foreground border border-border"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 my-1">
                <button
                  onClick={() => handlePtz("Pan LEFT")}
                  className="p-2 rounded hover:bg-secondary text-foreground border border-border"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    handlePtz("Home Position Reset");
                  }}
                  className="p-2 rounded hover:bg-secondary text-primary border border-primary/40"
                  title="Reset Home Position"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePtz("Pan RIGHT")}
                  className="p-2 rounded hover:bg-secondary text-foreground border border-border"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => handlePtz("Tilt DOWN")}
                className="p-2 rounded hover:bg-secondary text-foreground border border-border"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[10px] font-mono text-muted-foreground text-center">
              Bearing Angle: {camera.bearing}° · Digital Servo Latency: 42ms
            </div>
          </div>

          {/* Camera Hardware & Diagnostic Specs */}
          <div className="p-3 rounded-md border border-border bg-card space-y-2 font-mono text-xs">
            <span className="text-xs font-mono uppercase text-muted-foreground font-semibold block">
              Stream Telemetry &amp; Diagnostics
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-secondary/30 border border-border/60">
                <span className="text-muted-foreground text-[10px] block">RTSP STREAM:</span>
                <span className="font-semibold truncate block text-foreground">{camera.streamUrl}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/60">
                <span className="text-muted-foreground text-[10px] block">CODEC &amp; BITRATE:</span>
                <span className="font-semibold block text-foreground">H.264 · 4,096 kbps</span>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/60">
                <span className="text-muted-foreground text-[10px] block">LENS INTEGRITY:</span>
                <span className={camera.health.blur ? "text-warning font-bold" : "text-online flex items-center gap-1"}>
                  {camera.health.blur ? "OPTICAL BLUR DETECTED" : "CLEAR · NO OBSTRUCTION"}
                </span>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/60">
                <span className="text-muted-foreground text-[10px] block">FAILURES (24H):</span>
                <span className={camera.health.streamFailures24h > 0 ? "text-critical font-bold" : "text-foreground"}>
                  {camera.health.streamFailures24h} incidents
                </span>
              </div>
            </div>

            {/* Alerts on this camera */}
            {camera.activeAlertIds.length > 0 && (
              <div className="mt-2 p-2 rounded bg-critical/10 border border-critical/30 text-critical text-[11px]">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ACTIVE ALERT ON SENSOR:</span>
                </div>
                <span>Alert ID {camera.activeAlertIds.join(", ")} generated. Review in Alert Management.</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
