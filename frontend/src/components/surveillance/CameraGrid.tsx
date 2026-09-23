import React, { useState } from "react";
import type { Camera, Detection } from "@/types";
import { CameraCard } from "@/components/surveillance/CameraCard";
import { Search, Filter, Grid, LayoutGrid, Eye, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraGridProps {
  cameras: Camera[];
  detections?: Detection[];
}

export function CameraGrid({ cameras, detections = [] }: CameraGridProps) {
  const [layout, setLayout] = useState<"2x2" | "3x3" | "4x4">("3x3");
  const [filterZone, setFilterZone] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "priority" | "online" | "offline">("all");
  const [search, setSearch] = useState("");

  const filteredCameras = cameras.filter((cam) => {
    if (filterZone !== "all" && cam.zoneId !== filterZone) return false;
    if (filterStatus === "priority" && !cam.priority && cam.activeAlertIds.length === 0) return false;
    if (filterStatus === "online" && cam.status !== "online") return false;
    if (filterStatus === "offline" && cam.status !== "offline") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        cam.id.toLowerCase().includes(q) ||
        cam.name.toLowerCase().includes(q) ||
        cam.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const gridColsClass = {
    "2x2": "grid-cols-1 md:grid-cols-2",
    "3x3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4x4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[layout];

  return (
    <div className="space-y-4">
      {/* Tactical Filter & Grid Control Bar */}
      <div className="p-3 rounded-lg border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sensor ID or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Center: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
          >
            <option value="all">All Sensor Statuses</option>
            <option value="priority">Priority / Active Alerts</option>
            <option value="online">Online Streams Only</option>
            <option value="offline">Offline / Degraded</option>
          </select>

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
          >
            <option value="all">All Security Zones</option>
            <option value="ZN-RESTRICTED-A">Restricted Zone A (Salt Flats)</option>
            <option value="ZN-RESTRICTED-B">Restricted Zone B (North)</option>
            <option value="ZN-PATROL-E">Patrol Sector East</option>
            <option value="ZN-BUFFER-S">Buffer Zone South</option>
          </select>
        </div>

        {/* Right: Layout Switchers */}
        <div className="flex items-center gap-1 border border-border/80 rounded-md p-0.5 bg-secondary/30">
          <button
            onClick={() => setLayout("2x2")}
            title="2 Columns (Large Feeds)"
            className={cn(
              "px-2 py-1 rounded text-xs font-mono font-medium transition-colors",
              layout === "2x2" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            2×2
          </button>
          <button
            onClick={() => setLayout("3x3")}
            title="3 Columns (Standard Grid)"
            className={cn(
              "px-2 py-1 rounded text-xs font-mono font-medium transition-colors",
              layout === "3x3" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            3×3
          </button>
          <button
            onClick={() => setLayout("4x4")}
            title="4 Columns (High Density Matrix)"
            className={cn(
              "px-2 py-1 rounded text-xs font-mono font-medium transition-colors",
              layout === "4x4" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            4×4
          </button>
        </div>
      </div>

      {/* Camera Grid Viewport */}
      {filteredCameras.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-lg bg-card/40 font-mono text-xs text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto text-warning mb-2 opacity-80" />
          No surveillance sensors match the selected filter criteria.
        </div>
      ) : (
        <div className={cn("grid gap-4", gridColsClass)}>
          {filteredCameras.map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              detections={detections.filter((d) => d.cameraId === cam.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
