import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { searchService } from "@/services/searchService";
import type { SearchResultGroup } from "@/types";
import { Search, Shield, Car, User, Camera, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [query, setQuery] = useState("GJ01AB1234");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim()) {
      setLoading(true);
      searchService.globalSearch(query).then((res) => {
        setGroups(res);
        setLoading(false);
      });
    }
  }, [query]);

  const getIcon = (kind: string) => {
    switch (kind) {
      case "incident":
        return <Shield className="w-4 h-4 text-high" />;
      case "vehicle":
        return <Car className="w-4 h-4 text-primary" />;
      case "person":
        return <User className="w-4 h-4 text-online" />;
      case "camera_sighting":
        return <Camera className="w-4 h-4 text-info" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-critical" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Universal Tactical Entity Search
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                CROSS-SYSTEM AGGREGATOR
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Aggregated Results Across Cameras, Vehicles, Person Dossiers, Alerts &amp; Incidents
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all systems (e.g. GJ01AB1234, P102, CAM-03, INC-241)..."
              className="w-full pl-9 pr-3 py-2 bg-secondary/40 border border-input rounded-md text-xs font-mono font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>Quick Queries:</span>
            {["GJ01AB1234", "P102", "CAM-03", "INC-241", "ALT-102"].map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stream */}
        {loading && (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">
            Querying all surveillance indexes...
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-card/40">
            No records matched query &quot;{query}&quot;.
          </div>
        )}

        {!loading &&
          groups.map((group) => (
            <div key={group.group} className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-1.5 font-mono">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {group.group} ({group.items.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.refId}
                    onClick={() => item.route && navigate({ to: item.route })}
                    className="p-3.5 rounded-lg border border-border bg-card hover:border-primary cursor-pointer transition-all flex items-center justify-between group shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-secondary/70 border border-border/80 shrink-0 mt-0.5">
                        {getIcon(item.kind)}
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {item.detail}
                        </p>
                        {item.timestamp && (
                          <span className="text-[10px] text-muted-foreground/80 font-mono block mt-1">
                            Recorded: {item.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </ProtectedRoute>
  );
}
