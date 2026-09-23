import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TacticalBorderMap } from "@/components/gis/TacticalBorderMap";
import { MapPin, Radio, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

function MapPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Tactical GIS Border Situational Map
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                SECTOR WEST-9 GIS
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Geographic Information System · BOP Outposts · Restricted Polygons · Optical Sensor Cones
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-online">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>GEO-RADAR SYNCHRONIZATION: LIVE</span>
          </div>
        </div>

        {/* Active Intrusion Warning Banner */}
        <div className="p-3.5 rounded-lg border border-critical/40 bg-critical/10 flex items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-critical animate-ping" />
            <span className="font-bold text-critical">ACTIVE INTRUSION CORRIDOR:</span>
            <span className="text-foreground">Salt Flats Perimeter Sector A (CAM-03 ➔ CAM-04 ➔ CAM-05)</span>
          </div>
          <span className="text-muted-foreground text-[11px] hidden sm:inline">COORDINATES: 23.8296°N, 70.3861°E</span>
        </div>

        {/* Tactical Map Container */}
        <TacticalBorderMap />
      </div>
    </ProtectedRoute>
  );
}
