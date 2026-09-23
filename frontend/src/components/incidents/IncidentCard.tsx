import React from "react";
import type { Incident } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ShieldAlert, Camera, User, Car, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const navigate = useNavigate();

  return (
    <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
          </div>
          <StatusBadge status={incident.status} size="sm" />
        </div>

        <h3 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
          {incident.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {incident.summary}
        </p>

        {/* Telemetry info row */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/60 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Camera className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">Cams: {incident.cameraIds.join(", ")}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{incident.openedAt.split("T")[1]?.slice(0, 8)} IST</span>
          </div>

          {incident.personIds.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5 text-online shrink-0" />
              <span>Person: {incident.personIds.join(", ")}</span>
            </div>
          )}

          {incident.vehicleIds.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Car className="w-3.5 h-3.5 text-high shrink-0" />
              <span>Vehicle: {incident.vehicleIds.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">
          Assigned: @{incident.assignee}
        </span>
        <button
          onClick={() => navigate({ to: `/incidents/${incident.id}` })}
          className="text-xs font-mono text-primary font-semibold hover:underline flex items-center gap-1"
        >
          <span>Open AI Incident Story</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
