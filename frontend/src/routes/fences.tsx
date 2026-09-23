import React, { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { fenceService } from "@/services/fenceService";
import type { VirtualFence, FenceShape, Severity } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import {
  Fence,
  Plus,
  Play,
  Check,
  AlertTriangle,
  Clock,
  Camera as CameraIcon,
  Layers,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
  CircleDot,
  Trash2,
  Power,
  Shield,
  Crosshair,
  MapPin,
  X,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fences")({
  component: VirtualFencesPage,
});

function VirtualFencesPage() {
  const [fences, setFences] = useState<VirtualFence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFenceId, setSelectedFenceId] = useState<string>("VF-01");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New fence form state
  const [name, setName] = useState("");
  const [shape, setShape] = useState<FenceShape>("line");
  const [severity, setSeverity] = useState<Severity>("HIGH");
  const [direction, setDirection] = useState<"in" | "out" | "both">("both");
  const [activeHours, setActiveHours] = useState("24x7");
  const [selectedCameras, setSelectedCameras] = useState<string[]>(["CAM-03"]);
  const [alertType, setAlertType] = useState("Virtual Fence Intrusion");

  useEffect(() => {
    loadFences();
  }, []);

  const loadFences = async () => {
    setLoading(true);
    try {
      const data = await fenceService.getAll();
      setFences(data);
      if (data.length > 0 && !selectedFenceId) {
        setSelectedFenceId(data[0].id);
      }
    } catch {
      toast.error("Failed to load virtual fences");
    } finally {
      setLoading(false);
    }
  };

  const selectedFence = useMemo(() => {
    return fences.find((f) => f.id === selectedFenceId) || fences[0] || null;
  }, [fences, selectedFenceId]);

  const handleToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await fenceService.toggleEnabled(id);
      setFences((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast.success(
        `Virtual Fence ${id} ${updated.enabled ? "ACTIVATED" : "DEACTIVATED"} for automated tripwire detection`
      );
    } catch {
      toast.error("Failed to update fence state");
    }
  };

  const handleSimulateBreach = (fence: VirtualFence) => {
    toast.error(`TRIPWIRE BREACH SIMULATED: ${fence.name} (${fence.id})`, {
      description: `Cross-boundary violation detected on ${fence.cameraIds.join(", ")} heading ${
        fence.direction === "both" ? "bidirectionally" : fence.direction
      }. Automated alert generated!`,
    });
  };

  const handleCreateFence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a fence designation");
      return;
    }

    try {
      const newFence = await fenceService.create({
        name: name.trim(),
        shape,
        severity,
        direction,
        activeHours,
        cameraIds: selectedCameras,
        alertType,
        enabled: true,
        points:
          shape === "circle"
            ? [{ lat: 23.835, lng: 70.395 }]
            : [
                { lat: 23.832, lng: 70.385 },
                { lat: 23.834, lng: 70.401 },
              ],
        radiusM: shape === "circle" ? 500 : undefined,
      });

      setFences((prev) => [newFence, ...prev]);
      setSelectedFenceId(newFence.id);
      setIsCreateModalOpen(false);
      setName("");
      toast.success(`Virtual Fence ${newFence.id} created and calibrated`);
    } catch {
      toast.error("Failed to create fence");
    }
  };

  const getDirectionIcon = (dir: "in" | "out" | "both") => {
    switch (dir) {
      case "in":
        return <ArrowRight className="w-3.5 h-3.5 text-blue-400" />;
      case "out":
        return <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />;
      case "both":
      default:
        return <ArrowRightLeft className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Fence className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Virtual Fences &amp; Geo-Barriers
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-primary/20 border border-primary/40 text-primary">
                GEO-AI ENGINE
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Tripwire geometry calibration · Inward/outward crossing heuristics · Time-window rules · Sensor bindings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Calibrate New Barrier
            </button>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Active Tripwires</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
              {fences.filter((f) => f.enabled).length} / {fences.length}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
              <Check className="w-2.5 h-2.5" /> AI Engine Listening
            </div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Critical Perimeter Lines</div>
            <div className="text-xl font-bold font-mono text-red-400 mt-0.5">
              {fences.filter((f) => f.severity === "CRITICAL").length}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Zero tolerance threshold</div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Linked Optical / Thermal Sensors</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">6 Feeds</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Sub-second trigger latency</div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Flagship Breach Reference</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">VF-01</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">ALT-102 @ 18:42 Incident</div>
          </div>
        </div>

        {/* Main Content Layout: List on Left, Interactive Visual Calibration on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Fence List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                Configured Geo-Barriers ({fences.length})
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Select to inspect geometry</span>
            </div>

            {loading ? (
              <div className="p-8 text-center font-mono text-xs text-muted-foreground">
                Loading barrier geometries...
              </div>
            ) : (
              <div className="space-y-2.5">
                {fences.map((fence) => {
                  const isSelected = selectedFenceId === fence.id;
                  return (
                    <div
                      key={fence.id}
                      onClick={() => setSelectedFenceId(fence.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground">{fence.id}</span>
                            <span className="text-xs font-semibold text-foreground">{fence.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <SeverityBadge severity={fence.severity} />
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 uppercase">
                              {fence.shape}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                              {getDirectionIcon(fence.direction)}
                              {fence.direction}
                            </span>
                          </div>
                        </div>

                        {/* Enable/Disable toggle */}
                        <button
                          onClick={(e) => handleToggle(fence.id, e)}
                          title={fence.enabled ? "Deactivate Barrier" : "Activate Barrier"}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            fence.enabled
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info footer */}
                      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CameraIcon className="w-3 h-3 text-primary" /> {fence.cameraIds.join(", ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fence.activeHours}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateBreach(fence);
                          }}
                          title="Simulate tripwire violation"
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5" /> Test Breach
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Geometry Calibration View (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedFence ? (
              <div className="rounded-xl border border-border/80 bg-card/70 overflow-hidden shadow-lg">
                {/* Visual Canvas Display */}
                <div className="relative aspect-[16/10] bg-zinc-950 border-b border-border/80 overflow-hidden flex items-center justify-center p-6">
                  {/* Radar grid lines */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #00FF88 1px, transparent 1px), linear-gradient(to bottom, #00FF88 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                  {/* Circular radar rings */}
                  <div className="absolute w-[450px] h-[450px] rounded-full border border-primary/10 pointer-events-none" />
                  <div className="absolute w-[300px] h-[300px] rounded-full border border-primary/15 pointer-events-none" />
                  <div className="absolute w-[150px] h-[150px] rounded-full border border-primary/20 pointer-events-none" />

                  {/* Geometric Graphic rendering for selected fence */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {selectedFence.shape === "line" ? (
                      <div className="relative w-4/5 h-24 flex items-center justify-center">
                        {/* The Tripwire Line */}
                        <div
                          className={`w-full h-1 relative ${
                            selectedFence.severity === "CRITICAL"
                              ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                              : "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                          }`}
                        >
                          {/* Pulsing traversal particles */}
                          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md animate-ping" />
                          <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md animate-ping" />

                          {/* Directional Chevrons */}
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-mono font-bold text-red-400 bg-black/80 px-2 py-0.5 rounded border border-red-500/40">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            {selectedFence.direction.toUpperCase()} CROSSING ZONE
                          </div>
                        </div>

                        {/* Anchors */}
                        <div className="absolute left-0 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        </div>
                        <div className="absolute right-0 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        </div>
                      </div>
                    ) : selectedFence.shape === "polygon" ? (
                      <div className="relative w-64 h-44 border-2 border-amber-400 bg-amber-400/10 rounded-lg flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.3)]">
                        <div className="text-center font-mono space-y-1">
                          <div className="text-xs font-bold text-amber-300">POLYGON ENCLOSURE</div>
                          <div className="text-[10px] text-muted-foreground">Area: ~0.84 km²</div>
                          <div className="text-[10px] text-amber-400 animate-pulse">INTRUSION SENSING ACTIVE</div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-60 h-60 rounded-full border-2 border-emerald-400 bg-emerald-400/10 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <div className="text-center font-mono space-y-1">
                          <div className="text-xs font-bold text-emerald-300">CIRCULAR BUFFER</div>
                          <div className="text-[10px] text-muted-foreground">Radius: {selectedFence.radiusM || 420}m</div>
                          <div className="text-[10px] text-emerald-400 animate-pulse">RADIAL WATCH</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlay HUD Tags */}
                  <div className="absolute top-3 left-4 text-xs font-mono text-primary flex items-center gap-1.5 z-20">
                    <Crosshair className="w-3.5 h-3.5" />
                    TACTICAL GEOMETRY ENGINE · {selectedFence.id}
                  </div>
                  <div className="absolute bottom-3 left-4 text-[11px] font-mono text-muted-foreground z-20">
                    LAT: {selectedFence.points[0]?.lat.toFixed(4)}° N · LNG: {selectedFence.points[0]?.lng.toFixed(4)}° E
                  </div>
                  <div className="absolute bottom-3 right-4 z-20">
                    <button
                      onClick={() => handleSimulateBreach(selectedFence)}
                      className="px-2.5 py-1 rounded bg-red-600/90 hover:bg-red-600 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Simulate Breach Event
                    </button>
                  </div>
                </div>

                {/* Fence Properties Details Panel */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div>
                      <h3 className="font-display font-bold text-foreground text-base">
                        {selectedFence.name} ({selectedFence.id})
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">
                        Trigger: &ldquo;{selectedFence.alertType}&rdquo; &bull; Status:{" "}
                        <span className={selectedFence.enabled ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                          {selectedFence.enabled ? "ARMED & PATROLLING" : "DISARMED"}
                        </span>
                      </p>
                    </div>
                    <SeverityBadge severity={selectedFence.severity} />
                  </div>

                  {/* Attributes Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-background/70 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase block">Geometry</span>
                      <span className="text-foreground font-semibold uppercase">{selectedFence.shape}</span>
                    </div>
                    <div className="p-2.5 rounded bg-background/70 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase block">Direction</span>
                      <span className="text-foreground font-semibold uppercase">{selectedFence.direction}</span>
                    </div>
                    <div className="p-2.5 rounded bg-background/70 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase block">Schedule</span>
                      <span className="text-foreground font-semibold">{selectedFence.activeHours}</span>
                    </div>
                    <div className="p-2.5 rounded bg-background/70 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase block">Vertices</span>
                      <span className="text-foreground font-semibold">{selectedFence.points.length} Nodes</span>
                    </div>
                  </div>

                  {/* Linked Cameras */}
                  <div className="p-3.5 rounded-lg border border-border/60 bg-background/50 space-y-2">
                    <div className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CameraIcon className="w-3.5 h-3.5 text-primary" /> Associated Optical / Thermal Sensors
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">Auto-slews PTZ on tripwire trip</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFence.cameraIds.map((camId) => (
                        <div
                          key={camId}
                          className="px-2.5 py-1 rounded bg-card border border-border/80 text-xs font-mono text-foreground flex items-center gap-1.5 shadow-sm"
                        >
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span className="font-bold">{camId}</span>
                          <span className="text-[10px] text-muted-foreground">· 25 FPS RTSP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flagship Scenario Note */}
                  {selectedFence.id === "VF-01" && (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-mono space-y-1">
                      <div className="font-bold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        SIH 2026 Flagship Incident Anchor (ALT-102)
                      </div>
                      <p className="text-foreground/90">
                        VF-01 triggered alert ALT-102 at 18:42 when Subject P102 crossed from unmonitored salt flats into Restricted Zone A.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl border border-border/80 bg-card/40 font-mono text-xs text-muted-foreground">
                Select a virtual fence to view geometry and sensor bindings.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Calibrate New Barrier */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/70 bg-card/90">
                <div className="flex items-center gap-2">
                  <Fence className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-foreground text-sm">
                    CALIBRATE NEW GEO-BARRIER TRIPWIRE
                  </span>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFence} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Barrier Designation / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ridge Perimeter Charlie, Culvert Ingress Trap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Shape Geometry</label>
                    <select
                      value={shape}
                      onChange={(e) => setShape(e.target.value as FenceShape)}
                      className="w-full px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="line">Line (Tripwire Crossing)</option>
                      <option value="polygon">Polygon (Restricted Area)</option>
                      <option value="circle">Circle (Radial Exclusion)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Severity Rating</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className="w-full px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="CRITICAL">CRITICAL (Zero Tolerance)</option>
                      <option value="HIGH">HIGH (Immediate Triage)</option>
                      <option value="MEDIUM">MEDIUM (Standard Watch)</option>
                      <option value="LOW">LOW (Informational)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Crossing Direction</label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="both">Bidirectional (Both In/Out)</option>
                      <option value="in">Inward Only (Infiltration)</option>
                      <option value="out">Outward Only (Exfiltration)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Active Hours</label>
                    <input
                      type="text"
                      value={activeHours}
                      onChange={(e) => setActiveHours(e.target.value)}
                      placeholder="e.g. 24x7, 18:00 - 06:00"
                      className="w-full px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Linked Cameras (Comma separated IDs)
                  </label>
                  <input
                    type="text"
                    value={selectedCameras.join(", ")}
                    onChange={(e) =>
                      setSelectedCameras(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="CAM-03, CAM-04, CAM-05"
                    className="w-full px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 rounded text-xs font-mono border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-xs font-mono bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Save &amp; Arm Barrier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
