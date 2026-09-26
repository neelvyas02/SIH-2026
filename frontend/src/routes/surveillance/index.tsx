import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CameraGrid } from "@/components/surveillance/CameraGrid";
import { cameraService } from "@/services/cameraService";
import { detectionService } from "@/services/detectionService";
import type { Camera, Detection } from "@/types";
import { Video, Radio, Cpu, ArrowRight, Play } from "lucide-react";

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

        {/* AI Sentinel Engine Tactical Banner */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary uppercase">
                  ACTIVE AI SENTINEL ENGINE · WEB RUNNER
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-online/20 text-online border border-online/30">
                  NO TERMINAL REQUIRED
                </span>
              </div>
              <p className="text-xs text-foreground mt-0.5">
                Run and view the real-time YOLO Threat Sentinel (Weapons, Keypoint Wrist Grasps, IFF Military Camouflage) directly in your browser.
              </p>
            </div>
          </div>
          <Link
            to="/ai-engine"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono font-bold shadow-md shadow-primary/20 transition-all shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Sentinel Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
