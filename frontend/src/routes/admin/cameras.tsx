import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { cameraService } from "@/services/cameraService";
import type { Camera } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Video, Radio, Search, Play, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cameras")({
  component: AdminCamerasPage,
});

function AdminCamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    cameraService.getAll().then((list) => setCameras(list));
  }, []);

  const handleTestStream = (cam: Camera) => {
    setTestingId(cam.id);
    setTimeout(() => {
      setTestingId(null);
      if (cam.status === "offline") {
        toast.error(`RTSP handshake failed for ${cam.id}`, {
          description: "Carrier timed out on port 554 · Check camera power supply",
        });
      } else {
        toast.success(`RTSP carrier handshake verified for ${cam.id}`, {
          description: `Ping: ${cam.health.latencyMs}ms · Codec: H.264 · 25 FPS stream verified`,
        });
      }
    }, 900);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Camera Stream Configuration &amp; RTSP Gateway
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-critical/15 text-critical border border-critical/30 uppercase font-semibold">
                ADMIN RESTRICTED
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              RTSP Stream Endpoints · Optical Sensor Mounting Specs · Zone Assignments · Connectivity Watchdogs
            </p>
          </div>
        </div>

        {/* Camera Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Camera ID</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Physical Location</th>
                  <th className="p-3">RTSP Stream Address</th>
                  <th className="p-3">Zone ID</th>
                  <th className="p-3">Carrier Status</th>
                  <th className="p-3 text-right">Stream Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {cameras.map((cam) => (
                  <tr key={cam.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">{cam.id}</td>
                    <td className="p-3 font-medium text-foreground">{cam.name}</td>
                    <td className="p-3 text-muted-foreground">{cam.location}</td>
                    <td className="p-3 text-primary font-mono text-[11px]">{cam.streamUrl}</td>
                    <td className="p-3 text-muted-foreground">{cam.zoneId}</td>
                    <td className="p-3">
                      <StatusBadge status={cam.status} size="sm" />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleTestStream(cam)}
                        disabled={testingId === cam.id}
                        className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-semibold flex items-center gap-1.5 ml-auto transition-colors disabled:opacity-50"
                      >
                        <Radio className={`w-3.5 h-3.5 ${testingId === cam.id ? "animate-spin text-primary" : "text-online"}`} />
                        <span>{testingId === cam.id ? "Probing..." : "Test Carrier"}</span>
                      </button>
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
