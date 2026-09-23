import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { alertService } from "@/services/alertService";
import { cameraService } from "@/services/cameraService";
import type { Alert, AlertStatus, Camera, Severity } from "@/types";
import { AlertCard } from "@/components/alerts/AlertCard";
import { AlertActionDialog } from "@/components/alerts/AlertActionDialog";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { Bell, Filter, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [assignAlert, setAssignAlert] = useState<Alert | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  const fetchAlerts = () => {
    alertService.getAll().then((list) => setAlerts(list));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleStatusChange = async (id: string, status: AlertStatus) => {
    await alertService.updateStatus(id, status);
    fetchAlerts();
  };

  const handleAssignConfirm = async (alertId: string, assignee: string) => {
    await alertService.updateStatus(alertId, "assigned", assignee);
    fetchAlerts();
  };

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  const filtered = alerts.filter((a) => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterType !== "all" && !a.type.toLowerCase().includes(filterType.toLowerCase())) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.cameraId.toLowerCase().includes(q) ||
        (a.entityRef && a.entityRef.toLowerCase().includes(q))
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
              <Bell className="w-5 h-5 text-critical" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Operational Alert Management
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-critical/15 text-critical border border-critical/30 uppercase font-semibold">
                {alerts.filter((a) => a.status === "new").length} UNACKNOWLEDGED
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Perimeter Tripwires · Optical Night Movement · Vehicle Anomalies · Sensor Faults
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Alert ID, Entity (P102), Camera..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Severity Filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              <option value="all">All Alert Types</option>
              <option value="Intrusion">Intrusion</option>
              <option value="Night">Night Movement</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Face">Face</option>
              <option value="ANPR">ANPR</option>
              <option value="Suspicious">Suspicious Activity</option>
              <option value="Failure">Camera Failure</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="new">New (Unreviewed)</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="assigned">Assigned</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Alert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onStatusChange={handleStatusChange}
              onAssignClick={(a) => setAssignAlert(a)}
              onInspectCamera={handleInspectCamera}
            />
          ))}
        </div>

        {/* Duty Officer Assignment Dialog */}
        <AlertActionDialog
          alert={assignAlert}
          open={!!assignAlert}
          onClose={() => setAssignAlert(null)}
          onAssign={handleAssignConfirm}
        />

        {/* Camera Modal */}
        <CameraDetailModal
          camera={selectedCamera}
          open={!!selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
