import React, { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  aiEngineService,
  type AIEngineStatus,
  type AIModelMeta,
  type AILogEntry,
} from "@/services/aiEngineService";
import {
  Cpu,
  Play,
  Square,
  Video,
  Camera,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Radio,
  RefreshCw,
  Sliders,
  Terminal,
  Upload,
  ExternalLink,
  Crosshair,
  Eye,
  Maximize2,
  FolderArchive,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-engine")({
  component: AIEnginePage,
});

function AIEnginePage() {
  const [status, setStatus] = useState<AIEngineStatus | null>(null);
  const [models, setModels] = useState<AIModelMeta[]>([]);
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);

  // Configuration inputs
  const [sourceType, setSourceType] = useState<
    "webcam" | "browser" | "youtube" | "upload" | "rtsp" | "synthetic"
  >("webcam");
  const [customSource, setCustomSource] = useState("0");
  const [selectedModel, setSelectedModel] = useState("best.pt");
  const [confThresh, setConfThresh] = useState(0.25);
  const [usePose, setUsePose] = useState(false);
  const [enableTracking, setEnableTracking] = useState(true);
  const [enableIff, setEnableIff] = useState(true);
  const [saveEvidence, setSaveEvidence] = useState(true);

  // Browser webcam mode state
  const browserVideoRef = useRef<HTMLVideoElement | null>(null);
  const browserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [browserWebcamActive, setBrowserWebcamActive] = useState(false);
  const [browserAnnotatedFrame, setBrowserAnnotatedFrame] = useState<string | null>(null);
  const [browserStats, setBrowserStats] = useState<any>(null);

  // Stream cache-buster
  const [streamKey, setStreamKey] = useState(Date.now());
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Presets for YouTube testing
  const youtubePresets = [
    { label: "Border CCTV Feed (Sample)", url: "https://www.youtube.com/watch?v=1EiC9bvVGnk" },
    { label: "Urban Security Test Feed", url: "https://www.youtube.com/watch?v=5_XSYlAfJZM" },
  ];

  // Load initial models & status
  useEffect(() => {
    aiEngineService.getModels().then((data) => {
      setModels(data);
      if (data.length > 0 && !data.some((m) => m.filename === selectedModel)) {
        setSelectedModel(data[0].filename);
      }
    });

    aiEngineService.getStatus().then((st) => {
      setStatus(st);
      if (st.is_running) {
        setSelectedModel(st.model_name);
        setConfThresh(st.conf_thresh);
        setUsePose(st.use_pose);
        setEnableTracking(st.enable_tracking);
      }
    });

    aiEngineService.getLogs(60).then(setLogs);
  }, []);

  // Poll status & logs periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const currStatus = await aiEngineService.getStatus();
        setStatus(currStatus);

        if (autoRefreshLogs) {
          const recentLogs = await aiEngineService.getLogs(50);
          setLogs(recentLogs);
        }
      } catch {
        // silent fallback
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [autoRefreshLogs]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle Start Engine
  const handleStartEngine = async () => {
    setLoading(true);

    let effectiveSource = customSource;
    if (sourceType === "webcam") effectiveSource = "0";
    else if (sourceType === "synthetic") effectiveSource = "SYNTHETIC_GENERATOR";

    try {
      const res = await aiEngineService.start({
        source: effectiveSource,
        model_name: selectedModel,
        conf_thresh: confThresh,
        use_pose: usePose,
        enable_tracking: enableTracking,
        enable_iff: enableIff,
        save_evidence: saveEvidence,
      });

      toast.success(res.message || "AI Sentinel Engine activated successfully!");
      setStreamKey(Date.now());
      const updated = await aiEngineService.getStatus();
      setStatus(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to start AI Engine.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Stop Engine
  const handleStopEngine = async () => {
    setLoading(true);
    try {
      const res = await aiEngineService.stop();
      toast.info(res.message || "AI Engine stopped.");
      const updated = await aiEngineService.getStatus();
      setStatus(updated);
      setStreamKey(Date.now());
    } catch (err: any) {
      toast.error(err.message || "Failed to stop AI Engine.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Browser Webcam Toggle
  const toggleBrowserWebcam = async () => {
    if (browserWebcamActive) {
      // Stop webcam
      if (browserVideoRef.current && browserVideoRef.current.srcObject) {
        const stream = browserVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        browserVideoRef.current.srcObject = null;
      }
      setBrowserWebcamActive(false);
      setBrowserAnnotatedFrame(null);
      toast.info("Browser webcam feed stopped.");
    } else {
      // Start webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (browserVideoRef.current) {
          browserVideoRef.current.srcObject = stream;
          browserVideoRef.current.play();
        }
        setBrowserWebcamActive(true);
        toast.success("Browser webcam connected! Continuous AI inference active.");
      } catch (err: any) {
        toast.error("Could not access browser webcam: " + (err.message || "Permission denied"));
      }
    }
  };

  // Continuous loop for browser webcam frame detection
  useEffect(() => {
    if (!browserWebcamActive) return;

    let isProcessing = false;
    const interval = setInterval(async () => {
      if (isProcessing) return;
      const video = browserVideoRef.current;
      const canvas = browserCanvasRef.current;
      if (!video || !canvas || video.readyState !== 4) return;

      isProcessing = true;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (blob) {
              try {
                const result = await aiEngineService.detectFrame(
                  blob,
                  selectedModel,
                  confThresh,
                  usePose
                );
                if (result.annotated_image) {
                  setBrowserAnnotatedFrame(result.annotated_image);
                }
                setBrowserStats(result.stats);
              } catch {
                // frame error
              }
            }
            isProcessing = false;
          },
          "image/jpeg",
          0.8
        );
      } else {
        isProcessing = false;
      }
    }, 200); // 5 FPS client push

    return () => clearInterval(interval);
  }, [browserWebcamActive, selectedModel, confThresh, usePose]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.info(`Uploading ${file.name} to AI Engine...`);
    try {
      const res = await aiEngineService.uploadMedia(file, selectedModel, confThresh, usePose);
      if (res.file_type === "image" && res.annotated_image) {
        setBrowserAnnotatedFrame(res.annotated_image);
        toast.success("Image analyzed! Results displayed on monitor.");
      } else {
        toast.success("Video queued and streaming! Check the live tactical feed.");
        setStreamKey(Date.now());
      }
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const isRunning = status?.is_running ?? false;
  const threatLevel = status?.stats?.threat_level || "NORMAL";
  const armedCount = status?.stats?.armed_suspects || 0;
  const weaponsCount = status?.stats?.total_weapons || 0;
  const explosivesCount = status?.stats?.total_explosives || 0;
  const personsCount = status?.stats?.total_persons || 0;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Top Header & Tactical Status Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-sm">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                    BorderGuard Sentinel AI Engine
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                    WEB RUNTIME · ZERO-TERMINAL
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Real-Time YOLO Sentinel · Weapon & Explosive Recognition · Pose Wrist Grasp · IFF Camouflage Verification
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status LED Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold ${
                isRunning
                  ? "bg-online/15 border-online/40 text-online"
                  : "bg-muted/30 border-border text-muted-foreground"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? "bg-online animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span>{isRunning ? `STREAM ACTIVE (${status?.fps || 0} FPS)` : "ENGINE STANDBY"}</span>
            </div>

            {/* Threat Badge */}
            {threatLevel === "CRITICAL_THREAT" || armedCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-critical/20 border border-critical text-critical text-xs font-mono font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>CRITICAL THREAT DETECTED</span>
              </div>
            ) : weaponsCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>ELEVATED RISK: WEAPON FOUND</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-foreground text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-online" />
                <span>PERIMETER SECURE</span>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Armed Suspects */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              armedCount > 0
                ? "bg-critical/15 border-critical/60 shadow-lg shadow-critical/10"
                : "bg-card border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase">
                Armed Suspects
              </span>
              <Flame
                className={`w-4 h-4 ${armedCount > 0 ? "text-critical animate-bounce" : "text-muted-foreground"}`}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-2xl font-mono font-bold ${
                  armedCount > 0 ? "text-critical" : "text-foreground"
                }`}
              >
                {armedCount}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {armedCount > 0 ? "INTERCEPT REQUIRED" : "ZERO DETECTED"}
              </span>
            </div>
          </div>

          {/* Weapons */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase">
                Weapons Identified
              </span>
              <Crosshair className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-foreground">{weaponsCount}</span>
              <span className="text-[10px] font-mono text-muted-foreground">GUNS / KNIVES</span>
            </div>
          </div>

          {/* Explosives */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase">
                Explosive Hazards
              </span>
              <ShieldAlert className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-foreground">{explosivesCount}</span>
              <span className="text-[10px] font-mono text-muted-foreground">PACKAGES / BOMBS</span>
            </div>
          </div>

          {/* Persons */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase">
                Tracked Targets
              </span>
              <Eye className="w-4 h-4 text-online" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-foreground">{personsCount}</span>
              <span className="text-[10px] font-mono text-muted-foreground">PEDESTRIANS / FORCES</span>
            </div>
          </div>
        </div>

        {/* Main Workspace Grid: Live Video Monitor + AI Control Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left/Center: Tactical Video Monitor (Col 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-border bg-card/90 overflow-hidden shadow-xl flex flex-col">
              {/* Monitor Top Bar */}
              <div className="px-4 py-2.5 bg-secondary/40 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                    {sourceType === "browser"
                      ? "BROWSER CLIENT WEBCAM FEED"
                      : "LIVE SENTINEL OPTICAL HUD STREAM"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span>RES: 640x480</span>
                  <span>·</span>
                  <span className="text-online font-semibold">
                    {isRunning ? `${status?.fps || 30} FPS` : "STANDBY"}
                  </span>
                </div>
              </div>

              {/* Video Display Area */}
              <div className="relative aspect-4/3 w-full bg-black/90 flex items-center justify-center overflow-hidden">
                {sourceType === "browser" ? (
                  // Browser Webcam Mode
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={browserVideoRef}
                      className="hidden"
                      playsInline
                      muted
                    />
                    <canvas ref={browserCanvasRef} className="hidden" />

                    {browserAnnotatedFrame ? (
                      <img
                        src={browserAnnotatedFrame}
                        alt="Browser AI Detection Feed"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="p-8 text-center space-y-3">
                        <Camera className="w-12 h-12 text-muted-foreground mx-auto stroke-1" />
                        <p className="text-xs font-mono text-muted-foreground">
                          {browserWebcamActive
                            ? "Acquiring webcam frames and synchronizing with AI Sentinel..."
                            : "Click 'Connect Browser Webcam' on the right to stream directly from this device without any terminal."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Server MJPEG Stream (Webcam 0, RTSP, Video File, YouTube, Synthetic)
                  <img
                    key={streamKey}
                    src={aiEngineService.getStreamUrl()}
                    alt="BorderGuard AI Realtime Stream"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Overlaid Tactical HUD Details */}
                <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-primary border border-primary/30">
                    MODEL: {selectedModel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-muted-foreground border border-border/40">
                    CONF: {intPercent(confThresh)}% · POSE: {usePose ? "ACTIVE" : "OFF"} · IFF: {enableIff ? "ON" : "OFF"}
                  </span>
                </div>

                {/* Watermark */}
                <div className="absolute bottom-2 right-2 pointer-events-none">
                  <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                    BORDERGUARD TACTICAL DEFENSE HUD
                  </span>
                </div>
              </div>

              {/* Monitor Footer Controls */}
              <div className="p-3 bg-secondary/20 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStreamKey(Date.now())}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono border border-border transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Stream</span>
                  </button>
                  <Link
                    to="/evidence"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono border border-border transition-colors cursor-pointer"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-primary" />
                    <span>Evidence Vault</span>
                  </Link>
                  <Link
                    to="/alerts"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono border border-border transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Security Alerts</span>
                  </Link>
                </div>

                <div className="text-[11px] font-mono text-muted-foreground">
                  Frames Processed: <span className="font-bold text-foreground">{status?.frame_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Embedded AI Terminal Logs Console */}
            <div className="rounded-xl border border-border bg-[#0b0f14] overflow-hidden shadow-lg flex flex-col">
              <div className="px-4 py-2 bg-[#121820] border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-online" />
                  <span className="text-xs font-mono font-bold text-gray-200">
                    AI SENTINEL REAL-TIME PROCESS LOGS
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefreshLogs}
                      onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-0"
                    />
                    <span>Auto-Scroll</span>
                  </label>
                  <button
                    onClick={() => setLogs([])}
                    className="text-[11px] font-mono text-gray-400 hover:text-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div
                ref={logContainerRef}
                className="h-44 p-3 overflow-y-auto font-mono text-[11px] space-y-1 text-gray-300 select-text"
              >
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic py-2">
                    Waiting for AI Engine events and inference output...
                  </div>
                ) : (
                  logs.map((lg, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-gray-500 shrink-0">[{lg.timestamp}]</span>
                      <span
                        className={`font-semibold shrink-0 ${
                          lg.level === "ERROR"
                            ? "text-critical"
                            : lg.level === "WARNING"
                            ? "text-amber-400"
                            : "text-online"
                        }`}
                      >
                        [{lg.level}]
                      </span>
                      <span
                        className={
                          lg.level === "ERROR"
                            ? "text-critical"
                            : lg.level === "WARNING"
                            ? "text-amber-200"
                            : "text-gray-300"
                        }
                      >
                        {lg.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: AI Engine Tactical Control Panel (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">
                    Engine Controller
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  HOT-RELOAD READY
                </span>
              </div>

              {/* Master Run / Stop Button */}
              <div>
                {isRunning ? (
                  <button
                    onClick={handleStopEngine}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-critical hover:bg-critical/90 text-critical-foreground font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-critical/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>STOP AI ENGINE STREAM</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartEngine}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START AI SENTINEL (RUN WITHOUT TERMINAL)</span>
                  </button>
                )}
              </div>

              {/* 1. Input Source Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-foreground uppercase">
                  1. Video Stream Source
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("webcam");
                      setCustomSource("0");
                    }}
                    className={`p-2.5 rounded-md border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      sourceType === "webcam"
                        ? "bg-primary/15 border-primary text-primary font-bold"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Local Webcam (0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("browser");
                      toggleBrowserWebcam();
                    }}
                    className={`p-2.5 rounded-md border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      sourceType === "browser"
                        ? "bg-primary/15 border-primary text-primary font-bold"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Radio className="w-4 h-4 text-online" />
                    <span>Browser Webcam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("youtube");
                      setCustomSource(youtubePresets[0].url);
                    }}
                    className={`p-2.5 rounded-md border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      sourceType === "youtube"
                        ? "bg-primary/15 border-primary text-primary font-bold"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>YouTube Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("synthetic");
                      setCustomSource("SYNTHETIC_GENERATOR");
                    }}
                    className={`p-2.5 rounded-md border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      sourceType === "synthetic"
                        ? "bg-primary/15 border-primary text-primary font-bold"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Tactical Simulator</span>
                  </button>
                </div>

                {/* Secondary source inputs */}
                {sourceType === "youtube" && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                      placeholder="Paste YouTube video URL here..."
                      className="w-full px-3 py-1.5 rounded-md bg-secondary/50 border border-input text-xs font-mono text-foreground focus:outline-hidden"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {youtubePresets.map((pr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCustomSource(pr.url)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-primary border border-primary/20"
                        >
                          {pr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload media file */}
                <div className="pt-1">
                  <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md border border-dashed border-border hover:border-primary/60 bg-secondary/20 hover:bg-secondary/40 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Or Drag & Drop / Upload Video or Image File</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* 2. Model Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-foreground uppercase">
                  2. AI Model Weights
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-input text-xs font-mono text-foreground focus:outline-hidden cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.filename} value={m.filename}>
                      {m.label} ({m.filename}) - {m.size_mb} MB
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1">
                  {models
                    .find((m) => m.filename === selectedModel)
                    ?.classes.map((cls, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                      >
                        {cls}
                      </span>
                    ))}
                </div>
              </div>

              {/* 3. Detection Thresholds & Pose */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="font-semibold text-foreground">Confidence Threshold:</span>
                    <span className="font-bold text-primary">{intPercent(confThresh)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.85"
                    step="0.05"
                    value={confThresh}
                    onChange={(e) => setConfThresh(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {/* YOLOv8-Pose Toggle */}
                  <label className="flex items-center justify-between text-xs font-mono text-foreground cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5 text-primary" />
                      <div>
                        <div className="font-semibold">YOLOv8-Pose Wrist Grasp Association</div>
                        <div className="text-[10px] text-muted-foreground">
                          Estimates hand keypoints to flag carried weapons as ARMED SUSPECT
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={usePose}
                      onChange={(e) => setUsePose(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* ByteTrack Tracking Toggle */}
                  <label className="flex items-center justify-between text-xs font-mono text-foreground cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-online" />
                      <div>
                        <div className="font-semibold">ByteTrack Multi-Object Tracking</div>
                        <div className="text-[10px] text-muted-foreground">
                          Maintains persistent track IDs across occlusions
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableTracking}
                      onChange={(e) => setEnableTracking(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* IFF Camouflage Classifier */}
                  <label className="flex items-center justify-between text-xs font-mono text-foreground cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <div className="font-semibold">IFF Uniform Camouflage Classifier</div>
                        <div className="text-[10px] text-muted-foreground">
                          Differentiates friendly military forces from suspicious intruders
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableIff}
                      onChange={(e) => setEnableIff(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Evidence Vault Sync */}
                  <label className="flex items-center justify-between text-xs font-mono text-foreground cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <FolderArchive className="w-3.5 h-3.5 text-primary" />
                      <div>
                        <div className="font-semibold">Instant Evidence Vault Archival</div>
                        <div className="text-[10px] text-muted-foreground">
                          Auto-hashes and saves threat snapshots to database & disk
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={saveEvidence}
                      onChange={(e) => setSaveEvidence(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function intPercent(val: number): number {
  return Math.round(val * 100);
}
