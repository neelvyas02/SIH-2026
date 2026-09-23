import React, { useEffect, useState } from "react";
import { ShieldAlert, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { useNavigate } from "@tanstack/react-router";

export function LiveIncidentFeed() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    incidentService.getAll().then((list) => setIncidents(list));
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-high" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Live Tactical Incident Feed
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-high/15 text-high border border-high/30 font-semibold">
          {incidents.length} REGISTERED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 space-y-1.5">
        {incidents.map((inc) => {
          const lastEvent = inc.timeline[inc.timeline.length - 1];
          return (
            <div
              key={inc.id}
              onClick={() => navigate({ to: `/incidents/${inc.id}` })}
              className="p-3 rounded-md hover:bg-muted/40 cursor-pointer border border-transparent hover:border-border/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">{inc.id}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">· {inc.bopId}</span>
                </div>
                <SeverityBadge severity={inc.severity} />
              </div>

              <p className="text-xs font-medium text-foreground line-clamp-1">{inc.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{inc.summary}</p>

              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  {inc.openedAt.split("T")[1]?.slice(0, 8)} IST
                </span>
                <span className="text-primary font-semibold flex items-center gap-0.5 group">
                  Story Dossier <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
