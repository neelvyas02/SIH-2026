import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { cameraService } from "@/services/cameraService";
import type { Camera } from "@/types";
import { CameraHealthCard } from "@/components/health/CameraHealthCard";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { Activity, CheckCircle, XCircle, AlertTriangle, EyeOff, Radio } from "lucide-react";

export const Route = createFileRoute("/camera-health")({
  component: CameraHealthPage,
});

function CameraHealthPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  useEffect(() => {
    cameraService.getAll().then((list) => setCameras(list));
  }, []);

  const total = cameras.length;
  const online = cameras.filter((c) => c.status === "online").length;
  const offline = cameras.filter((c) => c.status === "offline").length;
  const lowFps = cameras.filter((c) => c.health.fps < 20).length;
  const blurCount = cameras.filter((c) => c.health.blur).length;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Camera Sensor Health &amp; Hardware Diagnostics
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                8 DEPLOYED SENSORS
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Real-Time Frame Rate (FPS) · Optical Blur &amp; Occlusion Detection · RTSP Heartbeat Watchdog
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-online">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>TELEMETRY POLLING: 1000ms</span>
          </div>
        </div>

        {/* Diagnostic KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">TOTAL SENSORS</span>
              <span className="text-2xl font-bold text-foreground">{total}</span>
            </div>
            <Activity className="w-5 h-5 text-primary opacity-60" />
          </div>

          <div className="p-3 rounded-lg border border-online/30 bg-online/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">ONLINE &amp; STREAMING</span>
              <span className="text-2xl font-bold text-online">{online}</span>
            </div>
            <CheckCircle className="w-5 h-5 text-online" />
          </div>

          <div className="p-3 rounded-lg border border-critical/30 bg-critical/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">STREAM LOST (OFFLINE)</span>
              <span className="text-2xl font-bold text-critical">{offline}</span>
            </div>
            <XCircle className="w-5 h-5 text-critical" />
          </div>

          <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">DEGRADED FPS</span>
              <span className="text-2xl font-bold text-warning">{lowFps}</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>

          <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">OPTICAL BLUR DETECTED</span>
              <span className="text-2xl font-bold text-warning">{blurCount}</span>
            </div>
            <EyeOff className="w-5 h-5 text-warning opacity-70" />
          </div>
        </div>

        {/* 8 Sensor Diagnostic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cameras.map((cam) => (
            <CameraHealthCard
              key={cam.id}
              camera={cam}
              onInspect={(c) => setSelectedCamera(c)}
            />
          ))}
        </div>

        {/* Camera Inspection Modal */}
        <CameraDetailModal
          camera={selectedCamera}
          open={!!selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
