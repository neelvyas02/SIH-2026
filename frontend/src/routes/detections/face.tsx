import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { detectionService } from "@/services/detectionService";
import { cameraService } from "@/services/cameraService";
import type { Camera, Detection } from "@/types";
import { DetectionCard } from "@/components/detections/DetectionCard";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { ScanFace, ShieldAlert, CheckCircle, Info } from "lucide-react";

export const Route = createFileRoute("/detections/face")({
  component: FaceDetectionPage,
});

function FaceDetectionPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  useEffect(() => {
    detectionService.getByKind("face").then((list) => setDetections(list));
  }, []);

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER", "INVESTIGATOR"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                AI Face Match Verification Console
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-info/10 text-info border border-info/30 uppercase font-semibold">
                INTELLIGENCE CELL ACCESS
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Backend Optical Match Results · Sector Watchlist Correlation · Human-in-the-Loop Review
            </p>
          </div>
        </div>

        {/* AI Disclaimer Alert */}
        <div className="p-3.5 rounded-lg border border-info/40 bg-info/10 flex items-start gap-3">
          <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-foreground">
            <span className="font-bold text-info block mb-0.5">
              AI INFERENCE INTEGRITY NOTICE
            </span>
            Match verdicts are computed strictly by the server-side biometric verification pipeline (v2.1). The client interface presents results verbatim and does not perform local facial feature extraction.
          </div>
        </div>

        {/* Grid of Face Match Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {detections.map((det) => (
            <DetectionCard
              key={det.id}
              detection={det}
              onInspectCamera={handleInspectCamera}
            />
          ))}
        </div>

        {/* Camera Modal */}
        <CameraDetailModal
          camera={selectedCamera}
          detections={detections.filter((d) => d.cameraId === selectedCamera?.id)}
          open={!!selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
