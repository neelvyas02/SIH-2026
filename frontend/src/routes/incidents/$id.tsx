import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { incidentService } from "@/services/incidentService";
import { cameraService } from "@/services/cameraService";
import type { Incident, Camera } from "@/types";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import {
  ShieldAlert,
  Camera as CameraIcon,
  User,
  Car,
  Flame,
  ArrowRight,
  FolderArchive,
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/incidents/$id")({
  component: IncidentStoryPage,
});

function IncidentStoryPage() {
  const { id } = Route.useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    incidentService.getById(id).then((inc) => setIncident(inc));
  }, [id]);

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  const handleStatusUpdate = async (status: Incident["status"]) => {
    if (!incident) return;
    const updated = await incidentService.updateStatus(incident.id, status);
    setIncident(updated);
    toast.success(`Incident ${incident.id} status updated to ${status.toUpperCase()}`);
  };

  if (!incident) {
    return (
      <ProtectedRoute>
        <div className="p-16 text-center font-mono text-xs text-muted-foreground">
          Loading AI Incident Narrative for {id}...
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <button
            onClick={() => navigate({ to: "/incidents" })}
            className="hover:text-foreground flex items-center gap-1 text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Incident Register</span>
          </button>
          <span>/</span>
          <span className="text-foreground font-semibold">{incident.id}</span>
        </div>

        {/* Incident Summary Card Header */}
        <div className="p-5 rounded-lg border border-border bg-card space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-high/15 border border-high/30 flex items-center justify-center text-high font-mono font-bold text-sm">
                AI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-display font-bold text-foreground">
                    {incident.id}: {incident.title}
                  </h1>
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Sector {incident.bopId} · Zone: {incident.zoneId} · Assigned: @{incident.assignee}
                </p>
              </div>
            </div>

            {/* Status Transition Toolbar */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {incident.status !== "contained" && (
                <button
                  onClick={() => handleStatusUpdate("contained")}
                  className="px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold"
                >
                  Mark Contained
                </button>
              )}
              {incident.status !== "closed" && (
                <button
                  onClick={() => handleStatusUpdate("closed")}
                  className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Close Incident
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-foreground/90 font-mono leading-relaxed bg-secondary/30 p-3 rounded-md border border-border/60">
            {incident.summary}
          </p>

          {/* Connected Entities Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-secondary/40 border border-border/70">
              <span className="text-[10px] text-muted-foreground block mb-1">CONNECTED CAMERAS:</span>
              <div className="flex flex-wrap gap-1">
                {incident.cameraIds.map((camId) => (
                  <button
                    key={camId}
                    onClick={() => handleInspectCamera(camId)}
                    className="px-1.5 py-0.5 rounded bg-card hover:bg-muted text-primary font-bold border border-border"
                  >
                    {camId}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded bg-secondary/40 border border-border/70">
              <span className="text-[10px] text-muted-foreground block mb-1">RELATED TARGET:</span>
              <span className="font-bold text-online">{incident.personIds.join(", ")}</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Cross-camera track</span>
            </div>

            <div className="p-2.5 rounded bg-secondary/40 border border-border/70">
              <span className="text-[10px] text-muted-foreground block mb-1">RELATED VEHICLE:</span>
              <span className="font-bold text-high">{incident.vehicleIds.join(", ")} (GJ01AB1234)</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Service track corridor</span>
            </div>

            <div className="p-2.5 rounded bg-secondary/40 border border-border/70 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-1">RISK EVALUATION:</span>
                <span className="font-bold text-high">HIGH (Score: 82/100)</span>
              </div>
              <button
                onClick={() => navigate({ to: "/risk" })}
                className="text-primary hover:underline text-[10px] flex items-center gap-0.5 mt-1 font-semibold"
              >
                <span>Explain Factors</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Chronological Narrative Timeline */}
        <div className="p-5 rounded-lg border border-border bg-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground block">
                AI Chronological Incident Narrative
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Synthesized Multi-Sensor Timeline: 18:40 CAM-03 to 19:02 Evidence Seal
              </span>
            </div>
            <button
              onClick={() => navigate({ to: "/evidence" })}
              className="px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-xs font-semibold flex items-center gap-1.5"
            >
              <FolderArchive className="w-3.5 h-3.5 text-primary" />
              <span>Inspect {incident.evidenceIds.length} Evidence Items</span>
            </button>
          </div>

          <IncidentTimeline
            events={incident.timeline}
            onInspectCamera={handleInspectCamera}
          />
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
