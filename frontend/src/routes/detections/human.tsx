import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { detectionService } from "@/services/detectionService";
import { cameraService } from "@/services/cameraService";
import type { Camera, Detection } from "@/types";
import { DetectionCard } from "@/components/detections/DetectionCard";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { Users, ShieldAlert, Filter, Search } from "lucide-react";

export const Route = createFileRoute("/detections/human")({
  component: HumanDetectionPage,
});

function HumanDetectionPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [search, setSearch] = useState("");
  const [filterCamera, setFilterCamera] = useState("all");

  useEffect(() => {
    detectionService.getByKind("human").then((list) => setDetections(list));
  }, []);

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  const filtered = detections.filter((d) => {
    if (filterCamera !== "all" && d.cameraId !== filterCamera) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        (d.subjectId && d.subjectId.toLowerCase().includes(q)) ||
        d.cameraId.toLowerCase().includes(q) ||
        d.positionLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                AI Human Detection Stream
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                {detections.length} RECOGNIZED
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Deep Learning Optical Pedestrian Classifiers · Bounding Boxes · Dynamic Confidence Scores
            </p>
          </div>
        </div>

        {/* Highlight Target Dossier Banner for P102 */}
        <div className="p-3.5 rounded-lg border border-critical/40 bg-critical/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-critical/20 border border-critical/40 flex items-center justify-center text-critical font-mono font-bold text-xs">
              P102
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-critical uppercase">
                TARGET OF INTEREST · PERSON P102
              </span>
              <p className="text-xs text-foreground mt-0.5">
                First detected on CAM-03 at 18:40:08 (94% conf) entering Restricted Zone A. Active tracking in progress.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-critical text-critical-foreground font-semibold">
            INTRUSION ACTIVE
          </span>
        </div>

        {/* Filter bar */}
        <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Subject ID (P102), Camera, Zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterCamera}
              onChange={(e) => setFilterCamera(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              <option value="all">All Cameras</option>
              <option value="CAM-03">CAM-03 (Salt Flats Alpha)</option>
              <option value="CAM-04">CAM-04 (Salt Flats Mid)</option>
              <option value="CAM-05">CAM-05 (Culvert South)</option>
              <option value="CAM-12">CAM-12 (Kharu West)</option>
            </select>
          </div>
        </div>

        {/* Grid of Human Detection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((det) => (
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
