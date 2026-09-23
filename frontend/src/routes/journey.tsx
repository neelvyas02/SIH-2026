import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { trackingService } from "@/services/trackingService";
import { cameraService } from "@/services/cameraService";
import type { Journey, Camera } from "@/types";
import { CrossCameraFlow } from "@/components/tracking/CrossCameraFlow";
import { JourneyHopTimeline } from "@/components/tracking/JourneyHopTimeline";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { GitBranch, Footprints, Car, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/journey")({
  component: JourneyPage,
});

function JourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState("JRN-P102");
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    trackingService.getJourneys().then((list) => setJourneys(list));
  }, []);

  const activeJourney = journeys.find((j) => j.id === selectedJourneyId) ?? journeys[0];

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Cross-Camera Journey Intelligence
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                CROSS-SENSOR RE-IDENTIFICATION
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Automated Entity Corridor Continuity · Dwell Time Analysis · Visual Step Pipeline
            </p>
          </div>
        </div>

        {/* Journey Switcher: P102 vs V17 vs P103 */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {journeys.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelectedJourneyId(j.id)}
              className={`p-3 rounded-lg border text-left font-mono transition-all flex items-center gap-3 shrink-0 ${
                j.id === activeJourney?.id
                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/10 ring-1 ring-primary"
                  : "border-border bg-card hover:bg-secondary/40"
              }`}
            >
              <div className="p-2 rounded bg-secondary text-primary shrink-0">
                {j.subjectType === "person" ? <Footprints className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {j.subjectType.toUpperCase()}: {j.subjectId}
                  </span>
                  {j.id === "JRN-P102" && (
                    <span className="text-[9px] font-bold px-1 rounded bg-critical text-critical-foreground">
                      FLAGSHIP SCENARIO
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {j.hops.length} Hops · Traversed {j.distanceM}m
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Flagship Scenario Journey Continuity Dossier Banner */}
        {activeJourney?.id === "JRN-P102" && (
          <div className="p-4 rounded-lg border border-high/40 bg-high/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-high uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>CROSS-CAMERA CONTINUITY CHAIN · INC-241</span>
              </span>
              <button
                onClick={() => navigate({ to: "/incidents/INC-241" })}
                className="text-xs font-mono text-high hover:underline font-bold flex items-center gap-1"
              >
                <span>Open Incident Story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-foreground font-mono">
              Individual P102 first seen at <strong>CAM-03 (18:40)</strong>, crossed fence line at <strong>18:42</strong>, re-identified on <strong>CAM-04 (18:43)</strong>, tracked across coverage gap to <strong>CAM-05 (18:48)</strong> heading toward culvert. Heading vector: <strong>265° West</strong>.
            </p>
          </div>
        )}

        {/* Visual Pipeline Component */}
        {activeJourney && (
          <CrossCameraFlow journey={activeJourney} onInspectCamera={handleInspectCamera} />
        )}

        {/* Comprehensive Hop Sequence & Dwell Analysis */}
        {activeJourney && (
          <div className="p-5 rounded-lg border border-border bg-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground block">
                  Sensor Acquisition Timeline &amp; Transit Log
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  First Sensor: {activeJourney.hops[0]?.cameraId} ➔ Current Sensor: {activeJourney.currentCameraId}
                </span>
              </div>
              <span className="text-xs font-mono text-primary font-bold">
                Total Traversed: {activeJourney.distanceM} METERS
              </span>
            </div>

            <JourneyHopTimeline
              hops={activeJourney.hops}
              onInspectCamera={handleInspectCamera}
            />
          </div>
        )}

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
