import React, { useEffect, useRef, useState } from "react";
import type { Camera, Detection } from "@/types";
import { cn } from "@/lib/utils";

interface CameraFeedCanvasProps {
  camera: Camera;
  detections?: Detection[];
  isPlaying?: boolean;
  className?: string;
  zoomLevel?: number;
}

export function CameraFeedCanvas({
  camera,
  detections = [],
  isPlaying = true,
  className,
  zoomLevel = 1,
}: CameraFeedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hudTime, setHudTime] = useState("");

  const isOffline = camera.status === "offline";
  const hasAlert = camera.activeAlertIds.length > 0;

  // Real-time HUD clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const d = now.toISOString().split("T")[0];
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0");
      setHudTime(`${d} ${h}:${m}:${s}.${ms}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 100);
    return () => clearInterval(timer);
  }, []);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Apply zoom if set
      if (zoomLevel > 1) {
        ctx.translate(w / 2, h / 2);
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-w / 2, -h / 2);
      }

      if (isOffline) {
        // Offline Static Noise Effect
        ctx.fillStyle = "#0c0d12";
        ctx.fillRect(0, 0, w, h);

        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = Math.random() * 50;
          data[i] = noise;
          data[i + 1] = noise + 5;
          data[i + 2] = noise + 10;
          data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Offline Alert Text
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("NO SIGNAL / STREAM LOST", w / 2, h / 2 - 10);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px monospace";
        ctx.fillText("RTSP CARRIER TIMEOUT · CAM-04 HARDWARE FAULT", w / 2, h / 2 + 15);
      } else {
        // Authentic Tactical Scene Backdrop
        const isNight = camera.nightVision;

        // Base gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        if (isNight) {
          bgGrad.addColorStop(0, "#08130f");
          bgGrad.addColorStop(0.5, "#0b1b15");
          bgGrad.addColorStop(1, "#07120e");
        } else {
          bgGrad.addColorStop(0, "#0e1726");
          bgGrad.addColorStop(0.5, "#152033");
          bgGrad.addColorStop(1, "#1c2a42");
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Terrain Elements based on scene
        ctx.strokeStyle = isNight ? "rgba(34, 197, 94, 0.25)" : "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1;

        if (camera.scene === "fence") {
          // Horizon line
          ctx.beginPath();
          ctx.moveTo(0, h * 0.45);
          ctx.lineTo(w, h * 0.45);
          ctx.stroke();

          // Fence posts
          for (let x = 30; x < w; x += 45) {
            ctx.beginPath();
            ctx.moveTo(x, h * 0.35);
            ctx.lineTo(x, h * 0.85);
            ctx.stroke();
          }

          // Barbed wire diagonals
          ctx.beginPath();
          for (let y = h * 0.4; y < h * 0.8; y += 18) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y + 10);
          }
          ctx.stroke();
        } else if (camera.scene === "road" || camera.scene === "checkpost") {
          // Perspective road
          ctx.beginPath();
          ctx.moveTo(w * 0.35, h * 0.45);
          ctx.lineTo(0, h);
          ctx.moveTo(w * 0.65, h * 0.45);
          ctx.lineTo(w, h);
          ctx.stroke();

          // Dashed center line
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(w * 0.5, h * 0.45);
          ctx.lineTo(w * 0.5, h);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Open desert / scrub terrain
          ctx.beginPath();
          ctx.moveTo(0, h * 0.5);
          ctx.bezierCurveTo(w * 0.3, h * 0.48, w * 0.7, h * 0.53, w, h * 0.5);
          ctx.stroke();
        }

        // Render AI Detections & Bounding Boxes
        detections.forEach((det) => {
          const bx = (det.bbox.x / 100) * w;
          const by = (det.bbox.y / 100) * h;
          const bw = (det.bbox.w / 100) * w;
          const bh = (det.bbox.h / 100) * h;

          const isCritical = det.subjectId === "P102" || det.kind === "anpr";
          const boxColor = isCritical ? "#ef4444" : "#22c55e";

          // Bounding Box
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(bx, by, bw, bh);

          // Corner accents for high-tech HUD look
          const cl = 6;
          ctx.beginPath();
          ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by);
          ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl);
          ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh);
          ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl);
          ctx.stroke();

          // Label pill
          const label = `${det.subjectId || det.kind.toUpperCase()} [${Math.round(det.confidence * 100)}%]`;
          ctx.font = "bold 9px monospace";
          const tw = ctx.measureText(label).width + 6;

          ctx.fillStyle = boxColor;
          ctx.fillRect(bx, by - 14, tw, 13);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(label, bx + 3, by - 4);
        });

        // Center reticle
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = isNight ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy);
        ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12);
        ctx.stroke();

        // Subtle Scanlines
        ctx.fillStyle = isNight ? "rgba(16, 185, 129, 0.03)" : "rgba(255, 255, 255, 0.02)";
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 1);
        }
      }

      ctx.restore();

      if (isPlaying && !isOffline) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [camera, detections, isOffline, isPlaying, zoomLevel]);

  return (
    <div
      className={cn(
        "relative aspect-video w-full bg-black rounded-md overflow-hidden border border-border/80 select-none",
        hasAlert && "ring-1 ring-critical/70",
        className
      )}
    >
      {/* Simulation Canvas */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover block"
      />

      {/* Top Left HUD: Camera ID, Live Status, FPS */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 font-mono text-[10px] bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-white/90 border border-white/10">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isOffline ? "bg-critical" : "bg-online animate-pulse"
          )}
        />
        <span className="font-bold text-primary">{camera.id}</span>
        <span className="text-white/40">|</span>
        <span>{isOffline ? "OFFLINE" : `${camera.health.fps} FPS`}</span>
        <span className="text-white/40">|</span>
        <span className="uppercase text-white/70">{camera.scene}</span>
      </div>

      {/* Top Right HUD: Timestamp */}
      <div className="absolute top-2 right-2 font-mono text-[10px] bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-white/90 border border-white/10 hidden sm:block">
        {hudTime}
      </div>

      {/* Bottom Left HUD: Location & Zone */}
      <div className="absolute bottom-2 left-2 font-mono text-[9px] bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-white/80 border border-white/10 truncate max-w-[70%]">
        {camera.location}
      </div>

      {/* Bottom Right HUD: AI Inference Badge */}
      <div className="absolute bottom-2 right-2 font-mono text-[9px] bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 text-white/80">
        <span className="w-1 h-1 rounded-full bg-primary" />
        <span>AI: {camera.aiStatus.toUpperCase()}</span>
      </div>
    </div>
  );
}
