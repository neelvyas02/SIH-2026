import React from "react";
import { MapPin, ArrowRight, ShieldAlert, Crosshair } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { bops, zones } from "@/data/geo";
import { cameras } from "@/data/cameras";

export function MiniMapPreview() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Tactical GIS Radar Overview
          </span>
        </div>
        <Link
          to="/map"
          className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 font-medium"
        >
          <span>Open Full Tactical GIS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Synthetic Tactical Radar Map Canvas SVG */}
      <div className="relative flex-1 min-h-[220px] bg-[#080d1a] overflow-hidden flex items-center justify-center p-4">
        {/* Radar concentric range circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-80 h-80 rounded-full border border-primary/40" />
          <div className="absolute w-56 h-56 rounded-full border border-primary/40" />
          <div className="absolute w-32 h-32 rounded-full border border-primary/40" />
          <div className="absolute w-full h-px bg-primary/30" />
          <div className="absolute h-full w-px bg-primary/30" />
        </div>

        {/* Sector Zone Polygon Preview */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Restricted Zone A (Salt Flats) */}
          <polygon
            points="140,80 280,75 310,170 120,165"
            fill="rgba(239, 68, 68, 0.12)"
            stroke="rgba(239, 68, 68, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Restricted Zone B */}
          <polygon
            points="30,20 120,15 130,90 20,80"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="rgba(245, 158, 11, 0.5)"
            strokeWidth="1.5"
          />
          {/* Journey Track Arrow: CAM-03 -> CAM-04 -> CAM-05 */}
          <polyline
            points="180,120 220,135 260,150"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Tactical Markers overlay */}
        <div className="relative w-full h-full flex flex-col justify-between z-10 pointer-events-none">
          {/* BOP-01 Marker */}
          <div className="absolute top-4 left-6 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-info border border-white" />
            <span className="font-mono text-[9px] text-white/90 bg-black/70 px-1 rounded">BOP-01 (Kharu)</span>
          </div>

          {/* BOP-02 Marker */}
          <div className="absolute top-6 right-10 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-info border border-white" />
            <span className="font-mono text-[9px] text-white/90 bg-black/70 px-1 rounded">BOP-02 (Sandtrack)</span>
          </div>

          {/* BOP-04 Marker */}
          <div className="absolute bottom-6 left-1/3 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-info border border-white" />
            <span className="font-mono text-[9px] text-white/90 bg-black/70 px-1 rounded">BOP-04 (Salt Flats)</span>
          </div>

          {/* Active Intrusion Hotspot at CAM-03 */}
          <div className="absolute top-1/2 left-[44%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-critical border border-white" />
            </span>
            <div className="mt-1 font-mono text-[9px] bg-critical text-white font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
              CAM-03 INTRUSION
            </div>
          </div>
        </div>

        {/* Legend strip at bottom */}
        <div className="absolute bottom-1 right-2 flex items-center gap-2 text-[9px] font-mono text-muted-foreground bg-black/80 px-2 py-0.5 rounded border border-white/10 z-20">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-xs bg-info" /> BOP</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-critical" /> Active Intrusion</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 border border-high" /> Restricted Zone</span>
        </div>
      </div>
    </div>
  );
}
