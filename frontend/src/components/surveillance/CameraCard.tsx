import React, { useState } from "react";
import type { Camera, Detection } from "@/types";
import { CameraFeedCanvas } from "@/components/surveillance/CameraFeedCanvas";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import {
  Maximize2,
  Camera as CameraIcon,
  Play,
  Pause,
  AlertTriangle,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CameraCardProps {
  camera: Camera;
  detections?: Detection[];
  className?: string;
}

export function CameraCard({ camera, detections = [], className }: CameraCardProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const hasAlert = camera.activeAlertIds.length > 0;
  const isPriority = camera.priority || hasAlert;

  const handleSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Optical frame saved for ${camera.id}`, {
      description: `Snapshot stored with timestamp ${new Date().toISOString()}`,
    });
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleToggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((z) => (z === 1 ? 1.5 : 1));
  };

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card flex flex-col overflow-hidden shadow-xs hover:border-primary/50 transition-all group",
          isPriority && "border-high/50 shadow-md shadow-high/5",
          hasAlert && "ring-1 ring-critical/60",
          className
        )}
      >
        {/* Card Header */}
        <div className="px-3 py-2 border-b border-border/80 bg-secondary/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-xs font-bold text-foreground tracking-wide">
              {camera.id}
            </span>
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {camera.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPriority && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-high/20 text-high border border-high/40 uppercase">
                PRIORITY
              </span>
            )}
            <StatusBadge status={camera.status} size="sm" />
          </div>
        </div>

        {/* Video Canvas Container */}
        <div
          className="relative cursor-pointer"
          onClick={() => setModalOpen(true)}
          title="Click to expand camera terminal"
        >
          <CameraFeedCanvas
            camera={camera}
            detections={detections}
            isPlaying={isPlaying}
            zoomLevel={zoomLevel}
          />

          {/* Quick Hover Controls Overlay */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded border border-white/10">
            <button
              onClick={handleTogglePlay}
              className="p-1 text-white hover:text-primary transition-colors"
              title={isPlaying ? "Pause Stream" : "Resume Stream"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-online" />}
            </button>
            <button
              onClick={handleToggleZoom}
              className="p-1 text-white hover:text-primary transition-colors"
              title="Toggle Digital Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSnapshot}
              className="p-1 text-white hover:text-primary transition-colors"
              title="Capture Snapshot"
            >
              <CameraIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              className="p-1 text-white hover:text-primary transition-colors"
              title="Inspect Full Terminal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Footer Telemetry & Quick Indicators */}
        <div className="px-3 py-2 bg-secondary/30 border-t border-border/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              <strong className="text-foreground">{camera.health.fps}</strong> FPS
            </span>
            <span>
              <strong className="text-foreground">{camera.health.latencyMs}</strong>ms
            </span>
            <span>
              P: <strong className="text-foreground">{camera.personCount}</strong>
            </span>
            <span>
              V: <strong className="text-foreground">{camera.vehicleCount}</strong>
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="text-[10px] text-primary hover:underline uppercase font-semibold tracking-wider flex items-center gap-1"
          >
            <span>INSPECT</span>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded Modal */}
      <CameraDetailModal
        camera={camera}
        detections={detections}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
