import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CameraGrid } from "@/components/surveillance/CameraGrid";
import { cameraService } from "@/services/cameraService";
import { detectionService } from "@/services/detectionService";
import type { Camera, Detection } from "@/types";
import { Video, Radio } from "lucide-react";

export const Route = createFileRoute("/surveillance/")({
  component: SurveillancePage,
});

function SurveillancePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cameraService.getAll(), detectionService.getAll()]).then(
      ([cams, dets]) => {
        setCameras(cams);
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
              <Video className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Live Surveillance Matrix
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                ALL 8 SECTOR FEEDS
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Live RTSP Streams · Optical/Thermal HUD Overlays · Dynamic AI Bounding Boxes · PTZ Control
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-online">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>7/8 STREAMS ACTIVE (CAM-04 TIMEOUT)</span>
          </div>
        </div>

        {/* Camera Grid */}
        {loading ? (
          <div className="p-16 text-center font-mono text-xs text-muted-foreground">
            Synchronizing RTSP optical video carriers...
          </div>
        ) : (
          <CameraGrid cameras={cameras} detections={detections} />
        )}
      </div>
    </ProtectedRoute>
  );
}
