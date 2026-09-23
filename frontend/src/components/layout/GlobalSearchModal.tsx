import React, { useEffect, useState } from "react";
import { Search, X, Shield, Car, User, Camera, AlertTriangle, ArrowRight } from "lucide-react";
import { searchService } from "@/services/searchService";
import type { SearchResultGroup } from "@/types";
import { useNavigate } from "@tanstack/react-router";

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setGroups([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setGroups([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchService.globalSearch(query).then((res) => {
        setGroups(res);
        setLoading(false);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const handleSelect = (route?: string) => {
    onClose();
    if (route) {
      navigate({ to: route });
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search Person ID, Vehicle, Plate (e.g. GJ01AB1234), Camera, Incident..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden font-mono"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 hover:bg-muted rounded text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Quick Suggestion Chips */}
        {!query && (
          <div className="p-4 border-b border-border/50 bg-card">
            <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold block mb-2">
              Tactical Quick Searches:
            </span>
            <div className="flex flex-wrap gap-2">
              {["P102", "GJ01AB1234", "CAM-03", "INC-241", "ALT-102", "BOP-04"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setQuery(chip)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-secondary/70 hover:bg-secondary border border-border/60 text-foreground transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              Scanning tactical indexes across cameras, radar & surveillance databases...
            </div>
          )}

          {!loading && query && groups.length === 0 && (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              No tactical records match &quot;{query}&quot;. Try Person ID (P102), Plate (GJ01AB1234), or Camera (CAM-03).
            </div>
          )}

          {!loading &&
            groups.map((group) => (
              <div key={group.group} className="mb-3 last:mb-0">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-muted-foreground">
                  {group.group}
                </div>
                <div className="space-y-1 mt-1">
                  {group.items.map((item) => (
                    <div
                      key={item.refId}
                      onClick={() => handleSelect(item.route)}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-muted/60 border border-border/40 shrink-0">
                          {getIcon(item.kind)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{item.detail}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>IBVAP Universal Query Matrix</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
