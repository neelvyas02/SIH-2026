import React, { useEffect, useState } from "react";
import { Bell, ShieldAlert, ArrowRight, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { alertService } from "@/services/alertService";
import type { Alert } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { useNavigate } from "@tanstack/react-router";

export function NotificationPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    alertService.getAll({ status: "new" }).then((list) => setAlerts(list.slice(0, 5)));
  }, []);

  const unreadCount = alerts.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-md hover:bg-accent/40 border border-border/40 text-foreground transition-colors focus:outline-hidden">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-critical text-[10px] font-mono font-bold text-critical-foreground animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 bg-card border-border p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-critical" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Active Security Alerts
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-critical/20 text-critical font-bold">
            {unreadCount} NEW
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground font-mono">
              <Check className="w-5 h-5 mx-auto text-online mb-1 opacity-80" />
              All security sectors cleared. No new alerts.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate({ to: "/alerts" })}
                className="p-3 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-foreground">{alert.id}</span>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1">{alert.type}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{alert.description}</p>
                <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-muted-foreground">
                  <span>{alert.cameraId} · {alert.bopId}</span>
                  <span>{alert.timestamp.split("T")[1]?.slice(0, 8)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-border bg-muted/10">
          <button
            onClick={() => navigate({ to: "/alerts" })}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono text-primary hover:bg-primary/10 transition-colors font-medium"
          >
            <span>Open Tactical Alert Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
