import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { KpiCard } from "@/components/common/KpiCard";
import { PriorityCameraStrip } from "@/components/dashboard/PriorityCameraStrip";
import { LiveIncidentFeed } from "@/components/dashboard/LiveIncidentFeed";
import { MiniMapPreview } from "@/components/dashboard/MiniMapPreview";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Bell,
  ShieldAlert,
  User,
  Car,
  AlertTriangle,
  Radio,
  ArrowRight,
  Flame,
} from "lucide-react";
import { cameraService } from "@/services/cameraService";
import { alertService } from "@/services/alertService";
import { incidentService } from "@/services/incidentService";
import { trackingService } from "@/services/trackingService";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [kpis, setKpis] = useState({
    totalCameras: 8,
    onlineCameras: 7,
    offlineCameras: 1,
    activeAlerts: 3,
    activeIncidents: 2,
    personsDetected: 3,
    vehiclesDetected: 2,
    highPriorityEvents: 2,
  });

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      cameraService.getAll(),
      alertService.getAll({ status: "new" }),
      incidentService.getAll(),
      trackingService.getPersons(),
      trackingService.getVehicles(),
    ]).then(([cams, alerts, incs, persons, vehicles]) => {
      const online = cams.filter((c) => c.status === "online").length;
      const offline = cams.filter((c) => c.status === "offline").length;
      const highPriority = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").length;

      setKpis({
        totalCameras: cams.length,
        onlineCameras: online,
        offlineCameras: offline,
        activeAlerts: alerts.length,
        activeIncidents: incs.filter((i) => i.status !== "closed").length,
        personsDetected: persons.length,
        vehiclesDetected: vehicles.length,
        highPriorityEvents: highPriority,
      });
    });
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Module Header & Tactical Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Operations Command Center
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                BOP-04 SALT FLATS
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Sector WEST-9 Real-Time Border Surveillance &amp; AI Threat Monitoring Matrix
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-online/10 text-online border border-online/30">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>RADAR &amp; OPTICAL SYNC: ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Flagship Scenario Urgent Alert Banner */}
        <div className="p-3.5 rounded-lg border border-critical/40 bg-critical/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-critical/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-critical text-critical-foreground shrink-0 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-critical tracking-wider">
                  HIGH-PRIORITY EVENT · VIRTUAL FENCE INTRUSION
                </span>
                <span className="text-[10px] font-mono px-1.5 rounded bg-critical text-critical-foreground font-bold">
                  INC-241
                </span>
              </div>
              <p className="text-xs text-foreground mt-0.5 font-medium">
                Person P102 breached Fence Line Alpha into Restricted Zone A at CAM-03. Cross-camera continuity confirmed across CAM-04 &amp; CAM-05.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate({ to: "/risk" })}
              className="px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Explain Risk (Score 82)</span>
            </button>
            <button
              onClick={() => navigate({ to: "/incidents/INC-241" })}
              className="px-3 py-1.5 rounded bg-critical text-critical-foreground font-mono text-xs font-semibold hover:bg-critical/90 flex items-center gap-1.5 transition-colors"
            >
              <span>Inspect Incident Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 8 Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard
            label="Total Cameras"
            value={kpis.totalCameras}
            icon={Camera}
            variant="default"
          />
          <KpiCard
            label="Online Feeds"
            value={kpis.onlineCameras}
            subValue="87.5%"
            icon={CheckCircle2}
            variant="online"
          />
          <KpiCard
            label="Offline Sensor"
            value={kpis.offlineCameras}
            subValue="CAM-04"
            icon={XCircle}
            variant="critical"
          />
          <KpiCard
            label="Active Alerts"
            value={kpis.activeAlerts}
            icon={Bell}
            variant="high"
          />
          <KpiCard
            label="Incidents"
            value={kpis.activeIncidents}
            icon={ShieldAlert}
            variant="default"
          />
          <KpiCard
            label="Persons Tracked"
            value={kpis.personsDetected}
            subValue="P102, P103"
            icon={User}
            variant="online"
          />
          <KpiCard
            label="Vehicles Tracked"
            value={kpis.vehiclesDetected}
            subValue="V17 (GJ01..)"
            icon={Car}
            variant="info"
          />
          <KpiCard
            label="High Priority"
            value={kpis.highPriorityEvents}
            icon={AlertTriangle}
            variant="critical"
          />
        </div>

        {/* AI Priority Camera Feeds */}
        <PriorityCameraStrip />

        {/* Lower Split: Tactical GIS Radar Overview + Live Incident Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[380px]">
          <MiniMapPreview />
          <LiveIncidentFeed />
        </div>
      </div>
    </ProtectedRoute>
  );
}
