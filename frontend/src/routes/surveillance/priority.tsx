import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { cameraService } from "@/services/cameraService";
import { detectionService } from "@/services/detectionService";
import type { Camera, Detection } from "@/types";
import { CameraCard } from "@/components/surveillance/CameraCard";
import { Camera as CameraIcon, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/surveillance/priority")({
  component: PrioritySurveillancePage,
});

function PrioritySurveillancePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cameraService.getAll(), detectionService.getAll()]).then(
      ([cams, dets]) => {
        // Priority cameras as identified in documentation
        const priority = cams.filter(
          (c) => c.priority || c.activeAlertIds.length > 0 || c.id === "CAM-12" || c.id === "CAM-18"
        );
        setCameras(priority);
        setDetections(dets);
        setLoading(false);
      }
    );
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <CameraIcon className="w-5 h-5 text-high" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                AI Priority Camera Surveillance
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-high/15 text-high border border-high/30 uppercase font-semibold">
                ACTIVE SECURITY EVENTS ONLY
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Sensors surfaced automatically by anomaly detection algorithms &amp; active tripwire breaches
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-high">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>3 SENSORS SURFACED FOR OPERATOR REVIEW</span>
          </div>
        </div>

        {/* Priority Reason Explanations Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-md border border-critical/40 bg-critical/10 text-xs font-mono">
            <span className="font-bold text-critical block">CAM-03 · VIRTUAL FENCE INTRUSION</span>
            <span className="text-muted-foreground text-[11px] mt-0.5 block">
              Person P102 breached Fence Line Alpha into Restricted Zone A. Severity: HIGH.
            </span>
          </div>
          <div className="p-3 rounded-md border border-high/40 bg-high/10 text-xs font-mono">
            <span className="font-bold text-high block">CAM-12 · NIGHT MOVEMENT DETECTED</span>
            <span className="text-muted-foreground text-[11px] mt-0.5 block">
              Movement detected inside Night Perimeter Bravo active hours. Severity: MEDIUM.
            </span>
          </div>
          <div className="p-3 rounded-md border border-info/40 bg-info/10 text-xs font-mono">
            <span className="font-bold text-info block">CAM-18 · VEHICLE CORRELATED</span>
            <span className="text-muted-foreground text-[11px] mt-0.5 block">
              Unregistered transport on south access track. Severity: LOW.
            </span>
          </div>
        </div>

        {/* Priority Grid */}
        {loading ? (
          <div className="p-16 text-center font-mono text-xs text-muted-foreground">
            Filtering priority camera channels...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameras.map((cam) => (
              <CameraCard
                key={cam.id}
                camera={cam}
                detections={detections.filter((d) => d.cameraId === cam.id)}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
