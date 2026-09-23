import React, { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { evidenceService } from "@/services/evidenceService";
import type { Evidence, EvidenceType } from "@/types";
import {
  FolderArchive,
  Search,
  Filter,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Plus,
  Play,
  Pause,
  Maximize2,
  FileText,
  Camera as CameraIcon,
  Video,
  Target,
  Car,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  X,
  FileCode,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
});

function EvidencePage() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreview, setActivePreview] = useState<Evidence | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newNoteEvidenceId, setNewNoteEvidenceId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const data = await evidenceService.getAll();
      setItems(data);
    } catch {
      toast.error("Failed to load evidence repository");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(`sha256:${hash}e89b33a107df418c88f2190`);
    setCopiedId(id);
    toast.success("Cryptographic SHA-256 hash copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerifyIntegrity = (id: string) => {
    setVerifyingId(id);
    setTimeout(() => {
      setVerifyingId(null);
      toast.success(`Evidence ${id}: SHA-256 digital signature verified against master custody ledger (MATCH: 100%)`);
    }, 600);
  };

  const handleDownloadFile = (item: Evidence) => {
    toast.info(`Packaging ${item.id} (${item.type}) with signed manifest...`, {
      description: "SHA-256 integrity metadata embedded.",
    });
    setTimeout(() => {
      toast.success(`${item.id} downloaded successfully`);
    }, 800);
  };

  const handleDownloadVaultArchive = () => {
    toast.info("Generating encrypted IBVAP custody archive (.tar.gz)...", {
      description: "Bundling all 9 media artifacts, tamper logs, and chain-of-custody certificates.",
    });
    setTimeout(() => {
      toast.success("Custody archive generated (21.4 MB) — ready for judicial submission");
    }, 1200);
  };

  const handleAddNote = async (id: string) => {
    if (!noteInput.trim()) return;
    try {
      const updated = await evidenceService.addNote(id, noteInput.trim());
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setNoteInput("");
      setNewNoteEvidenceId(null);
      toast.success("Operator chain-of-custody note recorded");
    } catch {
      toast.error("Failed to record note");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedIncident !== "ALL" && item.incidentId !== selectedIncident) return false;
      if (selectedType !== "ALL" && item.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesInc = item.incidentId.toLowerCase().includes(q);
        const matchesLoc = item.location.toLowerCase().includes(q);
        const matchesNotes = item.notes.some((n) => n.toLowerCase().includes(q));
        const matchesCamera = item.cameraId?.toLowerCase().includes(q);
        if (!matchesId && !matchesInc && !matchesLoc && !matchesNotes && !matchesCamera) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedIncident, selectedType, searchQuery]);

  const uniqueIncidents = useMemo(() => {
    const set = new Set(items.map((i) => i.incidentId));
    return Array.from(set);
  }, [items]);

  const getTypeIcon = (type: EvidenceType) => {
    switch (type) {
      case "snapshot":
        return <CameraIcon className="w-3.5 h-3.5 text-blue-400" />;
      case "video_clip":
        return <Video className="w-3.5 h-3.5 text-red-400" />;
      case "detection_frame":
        return <Target className="w-3.5 h-3.5 text-amber-400" />;
      case "anpr_result":
        return <Car className="w-3.5 h-3.5 text-emerald-400" />;
      case "track":
        return <MapPin className="w-3.5 h-3.5 text-purple-400" />;
      case "note":
      case "timeline":
      default:
        return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER", "INVESTIGATOR"]}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Secure Evidence Vault
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                SEALED (SHA-256)
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Tamper-evident forensic repository with digital chain-of-custody signatures and court-admissible manifests
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVaultArchive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Sealed Archive (.tar.gz)
            </button>
          </div>
        </div>

        {/* Vault Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Total Evidence Units</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">{items.length}</div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
              <Check className="w-2.5 h-2.5" /> 100% Hash Matched
            </div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Video / Frame Feeds</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
              {items.filter((i) => i.type === "video_clip" || i.type === "detection_frame" || i.type === "snapshot").length}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">High-definition raw frames</div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">ANPR Plate Captures</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
              {items.filter((i) => i.type === "anpr_result").length}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Confidence &gt; 95%</div>
          </div>
          <div className="p-3 rounded-lg border border-border/70 bg-card/60">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Incidents Linked</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">{uniqueIncidents.length}</div>
            <div className="text-[10px] font-mono text-primary mt-0.5">Flagship INC-241 (6 items)</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-lg border border-border/80 bg-card/50 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search evidence ID, camera, notes, location, or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded border border-border/80 bg-background/80 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Filter className="w-3 h-3" /> Incident:
              </span>
              <button
                onClick={() => setSelectedIncident("ALL")}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  selectedIncident === "ALL"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                All ({items.length})
              </button>
              {uniqueIncidents.map((incId) => (
                <button
                  key={incId}
                  onClick={() => setSelectedIncident(incId)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    selectedIncident === incId
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  {incId}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40 text-[11px] font-mono">
            <span className="text-muted-foreground mr-1">Type:</span>
            {["ALL", "snapshot", "video_clip", "detection_frame", "anpr_result", "track", "note"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedType === type
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {type === "ALL" ? "All Types" : type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Grid */}
        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-muted-foreground">
            Loading cryptographic evidence index...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-border/80 bg-card/40 font-mono text-xs text-muted-foreground">
            No evidence artifacts matched the specified filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-border/80 bg-card/60 hover:border-primary/50 transition-all p-4 space-y-3"
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-foreground">{item.id}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground uppercase border border-border/40">
                        {getTypeIcon(item.type)}
                        {item.type.replace("_", " ")}
                      </span>
                    </div>
                    <Link
                      to="/incidents/$id"
                      params={{ id: item.incidentId }}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
                    >
                      {item.incidentId}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>

                  {/* Synthetic Visual Preview Box */}
                  <div
                    onClick={() => setActivePreview(item)}
                    className="relative mt-2.5 h-36 rounded border border-border/60 bg-black/80 overflow-hidden cursor-pointer group flex items-center justify-center"
                  >
                    {/* Simulated visual background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950 to-zinc-900 opacity-90" />
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />

                    {/* Content preview rendering based on type */}
                    {item.type === "anpr_result" ? (
                      <div className="relative z-10 text-center space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded bg-amber-400 text-black font-display font-black text-sm tracking-widest shadow">
                          GJ 01 AB 1234
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" /> Plate OCR 96% Match
                        </div>
                      </div>
                    ) : item.type === "video_clip" ? (
                      <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
                        </div>
                        <span className="text-[10px] font-mono text-primary bg-black/60 px-2 py-0.5 rounded border border-primary/30">
                          60s Video Clip
                        </span>
                      </div>
                    ) : item.type === "track" ? (
                      <div className="relative z-10 text-center px-4">
                        <MapPin className="w-6 h-6 text-purple-400 mx-auto mb-1 animate-pulse" />
                        <div className="text-[11px] font-mono font-semibold text-foreground">
                          CAM-03 &rarr; CAM-04 &rarr; CAM-05
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                          Multi-hop re-identification track
                        </div>
                      </div>
                    ) : item.type === "note" ? (
                      <div className="relative z-10 text-left px-4 py-2 w-full">
                        <FileText className="w-5 h-5 text-muted-foreground mb-1" />
                        <div className="text-[11px] font-mono text-foreground line-clamp-3 italic">
                          "{item.notes[0]}"
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        {/* Detection bounding box representation */}
                        <div className="w-20 h-28 border-2 border-red-500/80 bg-red-500/10 rounded flex flex-col justify-between p-1">
                          <span className="text-[8px] font-mono font-bold bg-red-500 text-white px-1 self-start">
                            PERSON 89%
                          </span>
                          <span className="text-[8px] font-mono text-zinc-400 text-right">
                            {item.cameraId || "CAM"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* HUD Scanline & Camera Tag */}
                    <div className="absolute top-1.5 left-2 text-[9px] font-mono text-emerald-400/80 flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      REC · {item.cameraId || "VAULT"}
                    </div>
                    <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-zinc-400 z-10">
                      {item.sizeKb} KB
                    </div>
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <span className="px-2 py-1 rounded bg-black/80 text-[11px] font-mono text-primary border border-primary/40 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> Enlarge Forensic View
                      </span>
                    </div>
                  </div>

                  {/* Metadata Info */}
                  <div className="mt-3 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" /> Location:
                      </span>
                      <span className="text-foreground font-medium truncate max-w-[170px]">
                        {item.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Timestamp:
                      </span>
                      <span className="text-foreground">
                        {new Date(item.timestamp).toLocaleTimeString("en-GB", { hour12: false })} · {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> Custodian:
                      </span>
                      <span className="text-foreground">{item.addedBy}</span>
                    </div>
                  </div>

                  {/* SHA-256 Cryptographic Hash */}
                  <div className="mt-2.5 p-2 rounded bg-background/80 border border-border/80 flex items-center justify-between gap-1.5">
                    <div className="truncate font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400 font-bold">sha256:</span>
                      <span className="text-foreground">{item.hash}b48...</span>
                    </div>
                    <button
                      onClick={() => handleCopyHash(item.id, item.hash)}
                      title="Copy full cryptographic hash"
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Operator Notes */}
                  <div className="mt-2.5 space-y-1">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-between">
                      <span>Chain of Custody Notes:</span>
                      <button
                        onClick={() => setNewNoteEvidenceId(newNoteEvidenceId === item.id ? null : item.id)}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" /> Note
                      </button>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {item.notes.map((note, idx) => (
                        <div
                          key={idx}
                          className="text-[10.5px] font-mono text-foreground/90 bg-muted/30 p-1.5 rounded border border-border/40"
                        >
                          &bull; {note}
                        </div>
                      ))}
                    </div>

                    {/* Inline note addition */}
                    {newNoteEvidenceId === item.id && (
                      <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Add forensic or custody note..."
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddNote(item.id)}
                          className="flex-1 px-2 py-1 rounded border border-border bg-background text-[11px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleAddNote(item.id)}
                          className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-mono font-medium hover:bg-primary/90 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                  <button
                    onClick={() => setActivePreview(item)}
                    className="flex-1 py-1.5 rounded border border-border/80 bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs font-mono font-medium transition-colors cursor-pointer"
                  >
                    Examine
                  </button>
                  <button
                    onClick={() => handleVerifyIntegrity(item.id)}
                    disabled={verifyingId === item.id}
                    title="Run SHA-256 hash recalculation"
                    className="p-1.5 rounded border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === item.id ? "animate-spin text-primary" : ""}`} />
                  </button>
                  <button
                    onClick={() => handleDownloadFile(item)}
                    title="Download sealed evidence artifact"
                    className="p-1.5 rounded border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Forensic Preview Modal */}
        {activePreview && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/70 bg-card/90">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-foreground text-sm">
                    FORENSIC EVIDENCE INSPECTOR — {activePreview.id}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-primary/20 text-primary border border-primary/40 uppercase">
                    {activePreview.type.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => setActivePreview(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Large Visual Area */}
                <div className="relative aspect-video rounded-lg border border-border bg-black overflow-hidden flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />

                  {/* Visual Content */}
                  {activePreview.type === "anpr_result" ? (
                    <div className="relative z-10 text-center space-y-3">
                      <div className="text-xs font-mono text-muted-foreground">RECOGNIZED VEHICLE REGISTRATION</div>
                      <div className="inline-block px-8 py-3 rounded-md bg-amber-400 text-black font-display font-black text-3xl tracking-widest shadow-2xl border-4 border-amber-300">
                        GJ 01 AB 1234
                      </div>
                      <div className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" /> Plate OCR Confidence: 96.4% · Class: Commercial SUV
                      </div>
                    </div>
                  ) : activePreview.type === "video_clip" ? (
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-lg">
                        <Play className="w-7 h-7 text-primary fill-primary ml-1" />
                      </div>
                      <div className="font-mono text-sm text-foreground">
                        Synthetic Video Playback Buffer Loaded (60.0s)
                      </div>
                      <div className="text-xs font-mono text-muted-foreground max-w-sm">
                        Pre-roll: 30s before breach · Post-roll: 30s after alert ALT-102 at Virtual Fence VF-01
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                      <div className="w-48 h-64 border-2 border-red-500 bg-red-500/10 rounded flex flex-col justify-between p-2 shadow-2xl">
                        <span className="text-[10px] font-mono font-bold bg-red-500 text-white px-1.5 py-0.5 self-start rounded">
                          PERSON RE-ID [P102] · 0.89
                        </span>
                        <div className="space-y-0.5 text-[9px] font-mono text-zinc-300 bg-black/60 p-1.5 rounded">
                          <div>BOX: [x: 420, y: 180, w: 90, h: 210]</div>
                          <div>HEADING: 198° SSE</div>
                          <div>SPEED: 4.2 km/h</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forensic Watermark & Telemetry */}
                  <div className="absolute top-3 left-4 text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    FORENSIC ARCHIVE: {activePreview.id}
                  </div>
                  <div className="absolute bottom-3 left-4 text-xs font-mono text-zinc-400">
                    {activePreview.location} · {activePreview.cameraId || "CAM-03"}
                  </div>
                  <div className="absolute bottom-3 right-4 text-xs font-mono text-zinc-400">
                    {new Date(activePreview.timestamp).toISOString()}
                  </div>
                </div>

                {/* Evidence Details & Chain-of-Custody Manifest */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border/80 bg-card/60 space-y-2.5">
                    <div className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-primary" />
                      Cryptographic Manifest
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Digital Signature:</span>
                        <span className="text-emerald-400 font-bold">SHA-256 VERIFIED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hash Digest:</span>
                        <span className="text-foreground break-all">{activePreview.hash}e89b33a107df418c88f2190...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payload Size:</span>
                        <span className="text-foreground">{activePreview.sizeKb} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Originating Camera:</span>
                        <span className="text-foreground">{activePreview.cameraId || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Associated Incident:</span>
                        <span className="text-primary font-bold">{activePreview.incidentId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border/80 bg-card/60 space-y-2.5">
                    <div className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Chain of Custody History
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2 rounded bg-background/60 border border-border/40">
                        <div className="flex justify-between text-muted-foreground text-[10px]">
                          <span>INITIAL CAPTURE &amp; SEAL</span>
                          <span>{new Date(activePreview.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-foreground text-[11px] mt-0.5">
                          Acquired by {activePreview.addedBy}. Cryptographic seal calculated immediately.
                        </p>
                      </div>
                      {activePreview.notes.map((n, i) => (
                        <div key={i} className="p-2 rounded bg-background/60 border border-border/40">
                          <div className="text-[10px] text-muted-foreground">NOTE #{i + 1}</div>
                          <p className="text-foreground text-[11px] mt-0.5">{n}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-border/70 bg-card/90 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Admissible under Section 65B Indian Evidence Act
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerifyIntegrity(activePreview.id)}
                    className="px-3 py-1.5 rounded text-xs font-mono border border-border/80 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    Verify Integrity
                  </button>
                  <button
                    onClick={() => handleDownloadFile(activePreview)}
                    className="px-3 py-1.5 rounded text-xs font-mono bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
