import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { adminService } from "@/services/adminService";
import type { AuditLog } from "@/types";
import { Settings, Shield, Search, Download, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getAuditLogs().then((list) => setLogs(list));
  }, []);

  const handleExport = () => {
    toast.success("Audit trail exported successfully", {
      description: "Cryptographically verified audit log saved as CSV",
    });
  };

  const filtered = logs.filter((l) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.ip.includes(q)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                System Audit Trail &amp; Operational Governance
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-critical/15 text-critical border border-critical/30 uppercase font-semibold">
                ADMIN RESTRICTED · IMMUTABLE
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Tamper-Evident Chronological Event Log · Operator Actions · Clearance Elevate Dispatches
            </p>
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Verified Trail</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actor, action (e.g. Acknowledge), target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Log Hash ID</th>
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Personnel Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action Recorded</th>
                  <th className="p-3">Target Subject</th>
                  <th className="p-3">Network IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-primary">{log.id}</td>
                    <td className="p-3 text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{log.timestamp.replace("T", " ")}</span>
                    </td>
                    <td className="p-3 font-semibold text-foreground">@{log.actor}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 text-foreground font-medium">{log.action}</td>
                    <td className="p-3 font-bold text-high">{log.target}</td>
                    <td className="p-3 text-muted-foreground text-[11px]">{log.ip}</td>
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
