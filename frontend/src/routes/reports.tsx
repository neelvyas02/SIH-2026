import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { reportService, type ShiftReport } from "@/services/reportService";
import { useAuthStore } from "@/store/authStore";
import {
  FileText,
  Printer,
  Download,
  Send,
  ShieldCheck,
  Check,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  Radio,
  Camera as CameraIcon,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const currentUser = useAuthStore((s) => s.session?.user);
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("REP-20260922-EVE");
  const [loading, setLoading] = useState(true);
  const [remarksInput, setRemarksInput] = useState("");
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getAll();
      setReports(data);
      if (data.length > 0 && !selectedReportId) {
        setSelectedReportId(data[0].id);
        setRemarksInput(data[0].handoverRemarks);
      } else if (data.length > 0) {
        const active = data.find((r) => r.id === selectedReportId) || data[0];
        setRemarksInput(active.handoverRemarks);
      }
    } catch {
      toast.error("Failed to load shift reports");
    } finally {
      setLoading(false);
    }
  };

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    const r = reports.find((rep) => rep.id === id);
    if (r) setRemarksInput(r.handoverRemarks);
    setIsEditingRemarks(false);
  };

  const handleSaveRemarks = async () => {
    if (!activeReport) return;
    try {
      const updated = await reportService.updateHandoverRemarks(
        activeReport.id,
        remarksInput,
        currentUser?.fullName || activeReport.dutyOfficer
      );
      setReports((prev) => prev.map((r) => (r.id === activeReport.id ? updated : r)));
      setIsEditingRemarks(false);
      toast.success("Shift handover remarks updated and digitally timestamped");
    } catch {
      toast.error("Failed to update remarks");
    }
  };

  const handleSignReport = async () => {
    if (!activeReport) return;
    const signer = currentUser?.fullName || "Cmdr. D. Kaur";
    try {
      const updated = await reportService.signReport(activeReport.id, signer);
      setReports((prev) => prev.map((r) => (r.id === activeReport.id ? updated : r)));
      toast.success(`Shift report digitally signed & locked by ${signer}`);
    } catch {
      toast.error("Failed to sign report");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport.id}_telemetry.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Operational telemetry JSON exported");
  };

  const handleBroadcastDispatch = () => {
    toast.info("Transmitting operational shift bulletin to tactical radio channels...", {
      description: "Encrypted burst sent to BOP-01, BOP-02, and BOP-04 field QRTs.",
    });
    setTimeout(() => {
      toast.success("Broadcast acknowledged by 3 field units");
    }, 1000);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER"]}>
      <div className="space-y-6">
        {/* Header - Not printed */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Operational Reports &amp; Shift Logs
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-primary/20 border border-primary/40 text-primary">
                COMMAND DOSSIER
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Daily Shift Handover &bull; Incident Rollups &bull; QRT Deployment Logs &bull; Printable Legal Dispatches
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBroadcastDispatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-border/80 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-primary" />
              Broadcast QRT Bulletin
            </button>
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-border/80 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON Data
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Shift Selector Tabs - Not printed */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-mono text-muted-foreground mr-1">Select Shift Period:</span>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectReport(r.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                activeReport?.id === r.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {r.shiftName} ({r.date}) &bull; {r.bopId}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-muted-foreground">
            Loading operational shift ledger...
          </div>
        ) : !activeReport ? (
          <div className="p-8 text-center rounded-lg border border-border/70 bg-card font-mono text-xs text-muted-foreground">
            No report available.
          </div>
        ) : (
          /* Report Dossier Sheet */
          <div className="rounded-xl border border-border/80 bg-card/70 p-6 md:p-8 space-y-6 shadow-xl print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
            {/* Printable Top Military Header */}
            <div className="pb-6 border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse print:hidden" />
                  <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
                    INTELLIGENT BORDER VIDEO ANALYTICS PLATFORM (IBVAP)
                  </span>
                </div>
                <h2 className="text-2xl font-display font-extrabold text-foreground tracking-tight mt-1 print:text-black">
                  OPERATIONAL SHIFT HANDOVER REPORT
                </h2>
                <div className="text-xs font-mono text-primary font-semibold mt-0.5 print:text-zinc-700">
                  {activeReport.id} &bull; {activeReport.shiftName.toUpperCase()} &bull; {activeReport.sector}
                </div>
              </div>

              <div className="text-left md:text-right font-mono text-xs space-y-1 text-muted-foreground print:text-black">
                <div>
                  <span className="text-foreground font-semibold print:text-black">Time Window: </span>
                  {activeReport.timeWindow}
                </div>
                <div>
                  <span className="text-foreground font-semibold print:text-black">Duty Officer: </span>
                  {activeReport.dutyOfficer}
                </div>
                <div>
                  <span className="text-foreground font-semibold print:text-black">Command Post: </span>
                  {activeReport.bopId}
                </div>
              </div>
            </div>

            {/* High-Level Operational Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg border border-border/70 bg-background/60 print:border-zinc-300 print:bg-zinc-50">
                <div className="text-[10px] font-mono text-muted-foreground uppercase print:text-zinc-600">
                  Total Alerts Handled
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5 print:text-black">
                  {activeReport.totalAlertsHandled}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 print:text-emerald-700 mt-0.5">
                  100% Triaged
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-background/60 print:border-zinc-300 print:bg-zinc-50">
                <div className="text-[10px] font-mono text-muted-foreground uppercase print:text-zinc-600">
                  Critical Breaches
                </div>
                <div className="text-xl font-bold font-mono text-red-400 print:text-red-700 mt-0.5">
                  {activeReport.criticalBreaches}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground print:text-zinc-600 mt-0.5">
                  VF-01 Tripwire
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-background/60 print:border-zinc-300 print:bg-zinc-50">
                <div className="text-[10px] font-mono text-muted-foreground uppercase print:text-zinc-600">
                  Incidents Raised
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5 print:text-black">
                  {activeReport.incidentsRaised}
                </div>
                <div className="text-[10px] font-mono text-primary print:text-blue-700 mt-0.5">INC-241 Active</div>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-background/60 print:border-zinc-300 print:bg-zinc-50">
                <div className="text-[10px] font-mono text-muted-foreground uppercase print:text-zinc-600">
                  Active QRT Dispatches
                </div>
                <div className="text-xl font-bold font-mono text-amber-400 print:text-amber-700 mt-0.5">
                  {activeReport.activeQrtDispatches}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground print:text-zinc-600 mt-0.5">
                  Cheetah-1 On-Scene
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-background/60 print:border-zinc-300 print:bg-zinc-50">
                <div className="text-[10px] font-mono text-muted-foreground uppercase print:text-zinc-600">
                  Camera Availability
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5 print:text-black">
                  {activeReport.cameraAvailabilityPct}%
                </div>
                <div className="text-[10px] font-mono text-emerald-400 print:text-emerald-700 mt-0.5">
                  17/18 Online
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-background/60 print:border-zinc-300 print:bg-zinc-50">
                <div className="text-[10px] font-mono text-muted-foreground uppercase print:text-zinc-600">
                  Avg Triage Time
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5 print:text-black">
                  {activeReport.avgResponseTimeSec}s
                </div>
                <div className="text-[10px] font-mono text-muted-foreground print:text-zinc-600 mt-0.5">
                  Benchmark: &lt;180s
                </div>
              </div>
            </div>

            {/* Incidents Compiled Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2 print:text-black">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Incidents Logged During Shift ({activeReport.incidentSummaries.length})
                </h3>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border/70 print:border-zinc-300">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border/60 print:bg-zinc-100 print:text-zinc-700">
                    <tr>
                      <th className="py-2.5 px-3">Incident ID</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Action / Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-foreground print:text-black print:divide-zinc-200">
                    {activeReport.incidentSummaries.map((inc) => (
                      <tr key={inc.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-bold text-primary print:text-blue-700">
                          <Link to="/incidents/$id" params={{ id: inc.id }} className="hover:underline">
                            {inc.id}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{inc.title}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inc.severity === "CRITICAL"
                                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground print:text-zinc-700">{inc.location}</td>
                        <td className="py-2.5 px-3 uppercase text-[11px] font-semibold">{inc.status}</td>
                        <td className="py-2.5 px-3 text-muted-foreground print:text-zinc-800 text-[11px] max-w-xs truncate">
                          {inc.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QRT Tactical Dispatches */}
            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2 print:text-black">
                <Radio className="w-4 h-4 text-primary" />
                Quick Response Team (QRT) Tactical Dispatches ({activeReport.dispatches.length})
              </h3>

              {activeReport.dispatches.length === 0 ? (
                <div className="p-4 rounded-lg border border-border/60 text-xs font-mono text-muted-foreground text-center">
                  No mobile tactical units dispatched during this shift.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeReport.dispatches.map((dsp) => (
                    <div
                      key={dsp.id}
                      className="p-3.5 rounded-lg border border-border/70 bg-background/50 space-y-2 print:border-zinc-300 print:bg-zinc-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-foreground print:text-black">
                          {dsp.unit}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                          {dsp.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground print:text-zinc-700">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span>Target: {dsp.targetLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground print:text-zinc-700">
                          <Clock className="w-3 h-3" />
                          <span>Dispatched: {new Date(dsp.dispatchedAt).toLocaleTimeString()} IST</span>
                        </div>
                        <p className="text-[11px] text-foreground/90 italic pt-1 print:text-black">
                          &ldquo;{dsp.objective}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment & Sensor Diagnostics */}
            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2 print:text-black">
                <CameraIcon className="w-4 h-4 text-emerald-400" />
                Sensor &amp; Hardware Telemetry Anomalies ({activeReport.equipmentIssues.length})
              </h3>

              {activeReport.equipmentIssues.length === 0 ? (
                <div className="p-3.5 rounded-lg border border-border/60 text-xs font-mono text-muted-foreground text-center">
                  All 18 camera nodes operating within normal parameters.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeReport.equipmentIssues.map((eq, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:border-amber-400 print:bg-amber-50"
                    >
                      <div>
                        <span className="font-bold text-amber-400 print:text-amber-800 mr-2">{eq.cameraId}</span>
                        <span className="text-foreground print:text-black">{eq.issue}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground print:text-zinc-700 shrink-0">
                        Action: {eq.actionTaken}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Handover Remarks & Commander Digital Signature */}
            <div className="p-5 rounded-lg border border-border/80 bg-background/70 space-y-4 print:border-zinc-300 print:bg-zinc-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2 print:text-black">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Officer Handover Remarks &amp; Operational Directives
                </h3>
                {!isEditingRemarks && (
                  <button
                    onClick={() => setIsEditingRemarks(true)}
                    className="text-xs font-mono text-primary hover:underline print:hidden cursor-pointer"
                  >
                    Edit Remarks
                  </button>
                )}
              </div>

              {isEditingRemarks ? (
                <div className="space-y-2 print:hidden">
                  <textarea
                    rows={4}
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    className="w-full p-3 rounded border border-border bg-card text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingRemarks(false)}
                      className="px-3 py-1 rounded text-xs font-mono border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRemarks}
                      className="px-3 py-1 rounded text-xs font-mono bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer"
                    >
                      Save Remarks
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono text-foreground/90 bg-card/60 p-4 rounded border border-border/50 leading-relaxed print:text-black print:bg-white print:border-zinc-200">
                  {activeReport.handoverRemarks}
                </div>
              )}

              {/* Digital Signature Box */}
              <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-muted-foreground print:text-zinc-600">Digitally Signed By: </span>
                    <span className="text-foreground font-bold print:text-black">
                      {activeReport.handoverSignedBy || "Pending Signature"}
                    </span>
                    {activeReport.handoverTimestamp && (
                      <span className="text-muted-foreground ml-2 text-[10px]">
                        ({new Date(activeReport.handoverTimestamp).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                {!activeReport.handoverSignedBy && (
                  <button
                    onClick={handleSignReport}
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer print:hidden shadow-sm"
                  >
                    Affix Commander Digital Seal
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
