import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { incidentService } from "@/services/incidentService";
import type { Incident, IncidentStatus } from "@/types";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { ShieldAlert, Filter, Search, Plus } from "lucide-react";

export const Route = createFileRoute("/incidents/")({
  component: IncidentsIndexPage,
});

function IncidentsIndexPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    incidentService.getAll().then((list) => setIncidents(list));
  }, []);

  const filtered = incidents.filter((inc) => {
    if (filterStatus !== "all" && inc.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q) ||
        inc.cameraIds.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-high" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Operational Incident Register
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-high/15 text-high border border-high/30 uppercase font-semibold">
                {incidents.filter((i) => i.status !== "closed").length} ACTIVE CASES
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Multi-Alert Threat Synthesis · Consolidated Intelligence Dossiers · Chronological Narratives
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Incident ID (INC-241), Camera..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              <option value="all">All Incident Statuses</option>
              <option value="investigating">Investigating</option>
              <option value="open">Open</option>
              <option value="contained">Contained</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Incident Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} />
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
