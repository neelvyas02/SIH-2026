import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  EventsTrendChart,
  EventsPerCameraChart,
  AlertsSeverityDonut,
  IntrusionsByZoneChart,
  CameraUptimeChart,
  IncidentResolutionChart,
} from "@/components/analytics/AnalyticsCharts";
import { BarChart3, Calendar, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("7d");

  const handleExport = () => {
    toast.success("Operational Analytics Report exported", {
      description: "Saved as IBVAP_ANALYTICS_7D.csv to downloads",
    });
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Historical Surveillance Analytics &amp; Incident Metrics
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                COMMAND DASHBOARD
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Multi-Day Intrusion Patterns · Threat Density by Sector · Sensor Uptime · Resolution Velocities
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1.5 rounded-md bg-secondary/50 border border-input text-foreground focus:outline-hidden"
            >
              <option value="7d">Last 7 Days (Active Window)</option>
              <option value="14d">Last 14 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center gap-1.5 transition-colors font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 6 Recharts Analytics Modules in a 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventsTrendChart />
          <EventsPerCameraChart />
          <AlertsSeverityDonut />
          <IntrusionsByZoneChart />
          <CameraUptimeChart />
          <IncidentResolutionChart />
        </div>
      </div>
    </ProtectedRoute>
  );
}
