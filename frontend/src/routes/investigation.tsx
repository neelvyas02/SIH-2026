import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InvestigationTerminal } from "@/components/investigation/InvestigationTerminal";
import { Search } from "lucide-react";

export const Route = createFileRoute("/investigation")({
  component: InvestigationPage,
});

function InvestigationPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER", "INVESTIGATOR"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                AI Investigation Console
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-info/10 text-info border border-info/30 uppercase font-semibold">
                SECTOR INTELLIGENCE CELL
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Natural Language Semantic Search · Incident Correlation · ANPR Sighting Matrix · Cross-Sensor Dossiers
            </p>
          </div>
        </div>

        {/* Conversational Investigation Terminal */}
        <InvestigationTerminal />
      </div>
    </ProtectedRoute>
  );
}
