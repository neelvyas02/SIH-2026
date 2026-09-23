import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { detectionService } from "@/services/detectionService";
import { cameraService } from "@/services/cameraService";
import type { Camera, Detection } from "@/types";
import { DetectionCard } from "@/components/detections/DetectionCard";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { ScanLine, Search, Clock, Camera as CameraIcon, MapPin } from "lucide-react";

export const Route = createFileRoute("/detections/anpr")({
  component: AnprDetectionPage,
});

function AnprDetectionPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [searchPlate, setSearchPlate] = useState("GJ01AB1234");
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  useEffect(() => {
    detectionService.getByKind("anpr").then((list) => setDetections(list));
  }, []);

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  const filteredDetections = detections.filter((d) => {
    if (!searchPlate.trim()) return true;
    return d.plate?.toUpperCase().includes(searchPlate.trim().toUpperCase());
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Automatic Number Plate Recognition (ANPR)
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                SECTOR CHECKPOST MATRIX
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Optical Character Recognition · Checkpost Transit History · Target Vehicle Corridor Tracking
            </p>
          </div>
        </div>

        {/* ANPR Interactive Plate Search Bar */}
        <div className="p-4 rounded-lg border border-border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Search className="w-4 h-4 text-primary" />
              Plate Search &amp; Transit Chronology
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Example: Try <button onClick={() => setSearchPlate("GJ01AB1234")} className="text-primary underline">GJ01AB1234</button>
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              placeholder="Enter registration plate (e.g. GJ01AB1234)..."
              className="flex-1 px-3 py-2 bg-secondary/40 border border-input rounded-md text-xs font-mono font-bold tracking-wider text-foreground placeholder:text-muted-foreground uppercase focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {searchPlate && (
              <button
                onClick={() => setSearchPlate("")}
                className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-md text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Plate Sighting Chronology Timeline (if GJ01AB1234 searched) */}
        {searchPlate.toUpperCase().includes("GJ01") && (
          <div className="p-4 rounded-lg border border-primary/40 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between border-b border-primary/20 pb-2">
              <span className="text-xs font-mono font-bold text-primary uppercase">
                Transit Corridor Result for Plate: GJ01AB1234
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary text-primary-foreground font-semibold">
                3 SIGHTINGS RECORDED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded border border-border/80 bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-1">
                    <span>FIRST SIGHTING</span>
                    <span className="text-primary font-bold">18:42:12</span>
                  </div>
                  <span className="font-bold text-foreground block">CAM-03 (BOP-04)</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Salt Flats Fence Alpha · Service Track
                  </span>
                </div>
                <button
                  onClick={() => handleInspectCamera("CAM-03")}
                  className="mt-2 text-primary hover:underline text-[10px] flex items-center gap-1 font-semibold"
                >
                  <CameraIcon className="w-3 h-3" />
                  <span>Inspect CAM-03</span>
                </button>
              </div>

              <div className="p-3 rounded border border-border/80 bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-1">
                    <span>SECOND SIGHTING</span>
                    <span className="text-primary font-bold">18:55:21</span>
                  </div>
                  <span className="font-bold text-foreground block">CAM-08 (BOP-02)</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Sandtrack Checkpost Gate Barricade
                  </span>
                </div>
                <button
                  onClick={() => handleInspectCamera("CAM-08")}
                  className="mt-2 text-primary hover:underline text-[10px] flex items-center gap-1 font-semibold"
                >
                  <CameraIcon className="w-3 h-3" />
                  <span>Inspect CAM-08</span>
                </button>
              </div>

              <div className="p-3 rounded border border-border/80 bg-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-1">
                    <span>THIRD SIGHTING</span>
                    <span className="text-primary font-bold">19:10:05</span>
                  </div>
                  <span className="font-bold text-foreground block">CAM-12 (BOP-01)</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Kharu Approach Road Checkpoint
                  </span>
                </div>
                <button
                  onClick={() => handleInspectCamera("CAM-12")}
                  className="mt-2 text-primary hover:underline text-[10px] flex items-center gap-1 font-semibold"
                >
                  <CameraIcon className="w-3 h-3" />
                  <span>Inspect CAM-12</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detection Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDetections.map((det) => (
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
