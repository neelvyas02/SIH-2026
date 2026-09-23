import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { trackingService } from "@/services/trackingService";
import { cameraService } from "@/services/cameraService";
import type { Vehicle, Journey, Camera } from "@/types";
import { SubjectProfileCard } from "@/components/tracking/SubjectProfileCard";
import { JourneyHopTimeline } from "@/components/tracking/JourneyHopTimeline";
import { CrossCameraFlow } from "@/components/tracking/CrossCameraFlow";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { Car } from "lucide-react";

export const Route = createFileRoute("/tracking/vehicle")({
  component: VehicleTrackingPage,
});

function VehicleTrackingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("V17");
  const [journey, setJourney] = useState<Journey | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  useEffect(() => {
    trackingService.getVehicles().then((list) => setVehicles(list));
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      trackingService.getJourneyBySubjectId(selectedVehicleId).then((j) => setJourney(j));
    }
  }, [selectedVehicleId]);

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Vehicle Entity Tracking
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                TARGET VEHICLE: {selectedVehicleId}
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              ANPR &amp; Optical Vehicle Correlation · Transit Corridors · Checkpoint History
            </p>
          </div>
        </div>

        {/* Vehicle Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold tracking-wider transition-colors shrink-0 ${
                v.id === selectedVehicleId
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/80"
              }`}
            >
              <span>{v.id} · Plate: {v.plate}</span>
            </button>
          ))}
        </div>

        {/* Visual Cross-Camera Flow Pipeline */}
        {journey && (
          <CrossCameraFlow journey={journey} onInspectCamera={handleInspectCamera} />
        )}

        {/* Split Grid: Subject Profile Dossier + Hop Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeVehicle && (
            <div className="lg:col-span-1">
              <SubjectProfileCard
                subject={activeVehicle}
                type="vehicle"
                onInspectCamera={handleInspectCamera}
              />
            </div>
          )}

          <div className="lg:col-span-2 p-5 rounded-lg border border-border bg-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Chronological Transit Route for {selectedVehicleId}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {journey?.hops.length ?? 0} CHECKPOINT ACQUISITIONS
              </span>
            </div>

            {journey ? (
              <JourneyHopTimeline
                hops={journey.hops}
                onInspectCamera={handleInspectCamera}
              />
            ) : (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground">
                Loading trajectory hops...
              </div>
            )}
          </div>
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
