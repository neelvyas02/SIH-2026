import React, { useEffect, useState } from "react";
import { cameras } from "@/data/cameras";
import { bops, zones, OPERATIONAL_AREA } from "@/data/geo";
import type { Camera, Bop, Zone } from "@/types";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import {
  Layers,
  Camera as CameraIcon,
  ShieldAlert,
  MapPin,
  Crosshair,
  Maximize2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TacticalBorderMapProps {
  onSelectCamera?: (camera: Camera) => void;
}

export function TacticalBorderMap({ onSelectCamera }: TacticalBorderMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);
  const [layers, setLayers] = useState({
    cameras: true,
    bops: true,
    zones: true,
    tracks: true,
    incidents: true,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative w-full h-[680px] rounded-lg border border-border bg-[#090d16] overflow-hidden flex flex-col">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 z-40 bg-card/90 backdrop-blur-md border border-border p-2 rounded-lg shadow-xl font-mono text-xs space-y-2 max-w-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-border">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>TACTICAL GIS LAYERS</span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">Sector WEST-9</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={layers.cameras}
              onChange={() => toggleLayer("cameras")}
              className="rounded border-input text-primary h-3.5 w-3.5"
            />
            <span>Sensors ({cameras.length})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={layers.bops}
              onChange={() => toggleLayer("bops")}
              className="rounded border-input text-primary h-3.5 w-3.5"
            />
            <span>BOPs ({bops.length})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={layers.zones}
              onChange={() => toggleLayer("zones")}
              className="rounded border-input text-primary h-3.5 w-3.5"
            />
            <span>Zones ({zones.length})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={layers.tracks}
              onChange={() => toggleLayer("tracks")}
              className="rounded border-input text-primary h-3.5 w-3.5"
            />
            <span>Tracks (P102)</span>
          </label>
        </div>
      </div>

      {/* Synthetic Tactical Map Vector Grid */}
      <div className="relative flex-1 w-full h-full bg-[#0a101f] overflow-hidden select-none">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Concentric Radar Sweeps */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div className="w-[500px] h-[500px] rounded-full border border-primary/40" />
          <div className="w-[300px] h-[300px] rounded-full border border-primary/30" />
          <div className="w-[700px] h-[700px] rounded-full border border-primary/20" />
        </div>

        {/* Tactical SVG Overlays: Zones & Track Polyline */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Restricted Zone A Polygon (Salt Flats) */}
          {layers.zones && (
            <g>
              <polygon
                points="240,220 520,200 580,440 220,410"
                fill="rgba(239, 68, 68, 0.12)"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <text x="320" y="240" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold">
                RESTRICTED ZONE A (SALT FLATS PERIMETER)
              </text>
            </g>
          )}

          {/* Restricted Zone B Polygon (North) */}
          {layers.zones && (
            <g>
              <polygon
                points="80,40 320,30 340,180 60,160"
                fill="rgba(245, 158, 11, 0.08)"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <text x="90" y="60" fill="#f59e0b" fontSize="10" fontFamily="monospace">
                RESTRICTED ZONE B (NORTH GAP)
              </text>
            </g>
          )}

          {/* Buffer Zone South */}
          {layers.zones && (
            <polygon
              points="200,450 680,470 660,620 180,590"
              fill="rgba(56, 189, 248, 0.05)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Person P102 Trajectory Track Polyline: CAM-03 -> CAM-04 -> CAM-05 -> CAM-07 */}
          {layers.tracks && (
            <g>
              <polyline
                points="340,290 410,320 480,360 540,410"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
              <text x="360" y="310" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                TRACK P102 ➔
              </text>
            </g>
          )}
        </svg>

        {/* Interactive Tactical Nodes */}
        <div className="absolute inset-0 z-20 pointer-events-auto">
          {/* BOP-01 Marker */}
          {layers.bops && (
            <div className="absolute top-16 left-32 flex flex-col items-center">
              <span className="p-1 rounded bg-info text-white shadow-md">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-[10px] text-white bg-black/80 px-1.5 py-0.5 rounded border border-white/20 mt-1">
                BOP-01 (Kharu)
              </span>
            </div>
          )}

          {/* BOP-02 Marker */}
          {layers.bops && (
            <div className="absolute top-28 right-44 flex flex-col items-center">
              <span className="p-1 rounded bg-info text-white shadow-md">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-[10px] text-white bg-black/80 px-1.5 py-0.5 rounded border border-white/20 mt-1">
                BOP-02 (Sandtrack)
              </span>
            </div>
          )}

          {/* BOP-04 Marker */}
          {layers.bops && (
            <div className="absolute bottom-40 left-80 flex flex-col items-center">
              <span className="p-1 rounded bg-info text-white shadow-md">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-[10px] text-white bg-black/80 px-1.5 py-0.5 rounded border border-white/20 mt-1">
                BOP-04 (Salt Flats HQ)
              </span>
            </div>
          )}

          {/* Cameras Layer */}
          {layers.cameras && (
            <>
              {/* CAM-03 Marker (Active Intrusion) */}
              <div
                onClick={() => {
                  const cam = cameras.find((c) => c.id === "CAM-03");
                  if (cam) setSelectedCam(cam);
                }}
                className="absolute top-[280px] left-[330px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-critical border-2 border-white" />
                </span>
                <div className="mt-1 font-mono text-[10px] bg-critical text-white font-bold px-1.5 py-0.5 rounded shadow-lg group-hover:scale-105 transition-transform flex items-center gap-1">
                  <CameraIcon className="w-3 h-3" />
                  <span>CAM-03 [INTRUSION]</span>
                </div>
              </div>

              {/* CAM-04 Marker (Degraded / Stream Fail) */}
              <div
                onClick={() => {
                  const cam = cameras.find((c) => c.id === "CAM-04");
                  if (cam) setSelectedCam(cam);
                }}
                className="absolute top-[315px] left-[405px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              >
                <span className="w-3 h-3 rounded-full bg-offline border border-white" />
                <div className="mt-1 font-mono text-[10px] bg-secondary text-foreground px-1 rounded border border-border group-hover:border-primary">
                  CAM-04 [OFFLINE]
                </div>
              </div>

              {/* CAM-05 Marker */}
              <div
                onClick={() => {
                  const cam = cameras.find((c) => c.id === "CAM-05");
                  if (cam) setSelectedCam(cam);
                }}
                className="absolute top-[355px] left-[475px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              >
                <span className="w-3 h-3 rounded-full bg-online border border-white" />
                <div className="mt-1 font-mono text-[10px] bg-secondary text-foreground px-1 rounded border border-border group-hover:border-primary">
                  CAM-05
                </div>
              </div>

              {/* CAM-08 Marker */}
              <div
                onClick={() => {
                  const cam = cameras.find((c) => c.id === "CAM-08");
                  if (cam) setSelectedCam(cam);
                }}
                className="absolute top-[180px] right-[240px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              >
                <span className="w-3 h-3 rounded-full bg-high border border-white" />
                <div className="mt-1 font-mono text-[10px] bg-secondary text-foreground px-1 rounded border border-border group-hover:border-primary">
                  CAM-08 [ANPR HIT]
                </div>
              </div>

              {/* CAM-12 Marker */}
              <div
                onClick={() => {
                  const cam = cameras.find((c) => c.id === "CAM-12");
                  if (cam) setSelectedCam(cam);
                }}
                className="absolute top-[110px] left-[210px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              >
                <span className="w-3 h-3 rounded-full bg-medium border border-white" />
                <div className="mt-1 font-mono text-[10px] bg-secondary text-foreground px-1 rounded border border-border group-hover:border-primary">
                  CAM-12 [NIGHT MOV]
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tactical Coordinates HUD at Bottom */}
        <div className="absolute bottom-3 left-3 z-30 font-mono text-[10px] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 text-white/80 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <Crosshair className="w-3.5 h-3.5" />
            <span>GRID: 23°50&apos;35&quot;N 70°23&apos;10&quot;E</span>
          </div>
          <span>ALT: 18m</span>
          <span>DATUM: WGS84</span>
          <span>SECTOR: WEST-9 HQ</span>
        </div>

        {/* Legend Panel at Bottom Right */}
        <div className="absolute bottom-3 right-3 z-30 font-mono text-[10px] bg-black/80 backdrop-blur-md p-2.5 rounded border border-white/10 text-white/80 space-y-1">
          <div className="font-bold text-white mb-1">MAP LEGEND</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-critical" />
            <span>Intrusion / Tripwire Alarm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-online" />
            <span>Sensor Stream Online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-info" />
            <span>Border Outpost (BOP)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-primary" />
            <span>Person Trajectory Trail</span>
          </div>
        </div>
      </div>

      {/* Camera Inspection Modal */}
      <CameraDetailModal
        camera={selectedCam}
        open={!!selectedCam}
        onClose={() => setSelectedCam(null)}
      />
    </div>
  );
}
