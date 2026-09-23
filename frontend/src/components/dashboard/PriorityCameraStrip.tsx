import React, { useEffect, useState } from "react";
import { cameraService } from "@/services/cameraService";
import { detectionService } from "@/services/detectionService";
import type { Camera, Detection } from "@/types";
import { CameraCard } from "@/components/surveillance/CameraCard";
import { Camera as CameraIcon, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PriorityCameraStrip() {
  const [priorityCameras, setPriorityCameras] = useState<Camera[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    cameraService.getAll().then((all) => {
      // Prioritize CAM-03, CAM-12, CAM-18 as specified in documentation
      const prioritized = all.filter(
        (c) => c.id === "CAM-03" || c.id === "CAM-12" || c.id === "CAM-18"
      );
      setPriorityCameras(prioritized);
    });
    detectionService.getAll().then((dets) => setDetections(dets));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-4 h-4 text-high" />
          <h2 className="font-display font-bold text-sm tracking-wide text-foreground uppercase">
            AI Priority Camera Feeds
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-high/15 text-high border border-high/30 font-bold">
            SURFACED BY THREAT ENGINE
          </span>
        </div>
        <Link
          to="/surveillance/priority"
          className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
        >
          <span>View All Priority (3)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {priorityCameras.map((cam) => (
          <CameraCard
            key={cam.id}
            camera={cam}
            detections={detections.filter((d) => d.cameraId === cam.id)}
          />
        ))}
      </div>
    </div>
  );
}
