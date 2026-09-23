import React from "react";
import type { Alert, AlertStatus } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Camera,
  MapPin,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  FolderArchive,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  alert: Alert;
  onStatusChange: (id: string, status: AlertStatus) => void;
  onAssignClick: (alert: Alert) => void;
  onInspectCamera?: (cameraId: string) => void;
}

export function AlertCard({
  alert,
  onStatusChange,
  onAssignClick,
  onInspectCamera,
}: AlertCardProps) {
  const navigate = useNavigate();

  const handleAcknowledge = () => {
    onStatusChange(alert.id, "acknowledged");
    toast.success(`Alert ${alert.id} acknowledged by operator`);
  };

  const handleEscalate = () => {
    onStatusChange(alert.id, "escalated");
    toast.error(`Alert ${alert.id} escalated to Sector Commander`);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card flex flex-col justify-between transition-all hover:border-primary/50 shadow-xs",
        alert.status === "new" && "border-critical/40 bg-critical/5 ring-1 ring-critical/30"
      )}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">{alert.id}</span>
            <SeverityBadge severity={alert.severity} />
          </div>
          <StatusBadge status={alert.status} size="sm" />
        </div>

        {/* Alert Type & Description */}
        <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-high shrink-0" />
          <span>{alert.type}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {alert.description}
        </p>

        {/* Telemetry Pills */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/60 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Camera className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground">{alert.cameraId}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-info shrink-0" />
            <span className="truncate">{alert.bopId}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{alert.timestamp.split("T")[1]?.slice(0, 8)} IST</span>
          </div>

          {alert.entityRef && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5 text-online shrink-0" />
              <span className="font-bold text-primary">{alert.entityRef}</span>
            </div>
          )}
        </div>

        {alert.assignee && (
          <div className="mt-2 text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
            Assigned to: <strong className="text-foreground">@{alert.assignee}</strong>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="mt-4 pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
        {/* Quick Triage Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {alert.status === "new" && (
            <button
              onClick={handleAcknowledge}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border font-mono text-xs font-semibold text-foreground flex items-center gap-1 transition-colors"
              title="Acknowledge Receipt"
            >
              <CheckCircle className="w-3.5 h-3.5 text-online" />
              <span>ACKNOWLEDGE</span>
            </button>
          )}

          {alert.status !== "escalated" && alert.status !== "closed" && (
            <button
              onClick={handleEscalate}
              className="px-2.5 py-1 rounded bg-critical/15 hover:bg-critical/25 border border-critical/30 font-mono text-xs font-semibold text-critical flex items-center gap-1 transition-colors"
              title="Escalate to Command"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ESCALATE</span>
            </button>
          )}

          <button
            onClick={() => onAssignClick(alert)}
            className="px-2 py-1 rounded hover:bg-muted font-mono text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Assign Duty Officer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ASSIGN</span>
          </button>
        </div>

        {/* Deep Navigation Links */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {alert.incidentId && (
            <button
              onClick={() => navigate({ to: `/incidents/${alert.incidentId}` })}
              className="text-high hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>{alert.incidentId}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => navigate({ to: "/map" })}
            className="text-primary hover:underline flex items-center gap-0.5"
          >
            <span>MAP</span>
          </button>

          <button
            onClick={() => navigate({ to: "/evidence" })}
            className="text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <FolderArchive className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
