import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { detectionService } from "@/services/detectionService";
import { cameraService } from "@/services/cameraService";
import type { Camera, Detection, VehicleClass } from "@/types";
import { DetectionCard } from "@/components/detections/DetectionCard";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { Car, Filter, Search } from "lucide-react";

export const Route = createFileRoute("/detections/vehicle")({
  component: VehicleDetectionPage,
});

function VehicleDetectionPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");

  useEffect(() => {
    detectionService.getByKind("vehicle").then((list) => setDetections(list));
  }, []);

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  const filtered = detections.filter((d) => {
    if (filterClass !== "all" && d.vehicleClass !== filterClass) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        (d.plate && d.plate.toLowerCase().includes(q)) ||
        (d.vehicleClass && d.vehicleClass.toLowerCase().includes(q)) ||
        d.cameraId.toLowerCase().includes(q)
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
              <Car className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                AI Vehicle Classification &amp; Tracking
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                CLASSES: CAR · BIKE · TRUCK · BUS
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Automated Multi-Class Transport Identification Across Perimeter Service Tracks
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Plate (GJ01AB1234) or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              <option value="all">All Vehicle Classes</option>
              <option value="car">Cars / SUVs</option>
              <option value="truck">Trucks / Transports</option>
              <option value="bike">Bikes / Two-Wheelers</option>
              <option value="bus">Buses</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Grid of Vehicle Detection Cards */}
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
