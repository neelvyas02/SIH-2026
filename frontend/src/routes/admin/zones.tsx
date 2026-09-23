import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { adminService } from "@/services/adminService";
import type { Zone } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Layers, Shield, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/admin/zones")({
  component: AdminZonesPage,
});

function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    adminService.getZones().then((list) => setZones(list));
  }, []);

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Sector Zone Management &amp; Breach Rules
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-critical/15 text-critical border border-critical/30 uppercase font-semibold">
                ADMIN RESTRICTED
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Restricted Perimeters · Tripwire Geometry · Outpost Buffer Areas · Active Enforcement Schedules
            </p>
          </div>
        </div>

        {/* Zones Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Zone ID</th>
                  <th className="p-3">Zone Designation</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Breach Severity</th>
                  <th className="p-3">Assigned BOP</th>
                  <th className="p-3">Active Hours</th>
                  <th className="p-3">Geo-Vertices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">{zone.id}</td>
                    <td className="p-3 font-medium text-foreground">{zone.name}</td>
                    <td className="p-3 uppercase text-muted-foreground">{zone.type}</td>
                    <td className="p-3">
                      <SeverityBadge severity={zone.severity} />
                    </td>
                    <td className="p-3 text-muted-foreground">{zone.bopId}</td>
                    <td className="p-3 text-foreground">{zone.activeHours}</td>
                    <td className="p-3 text-muted-foreground">
                      {zone.polygon.length} GPS Coordinates
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
