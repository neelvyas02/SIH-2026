import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Shield, Eye, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export const VideoPlayer = ({ camera, zones = [], isAlertActive = false }) => {
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(25);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Dark night-sky surveillance background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      // 2. Terrain ground & horizon
      const groundY = h * 0.45;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // Draw barbed wire fence line
      for (let x = 0; x < w; x += 60) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, groundY - 40);
        ctx.lineTo(x, groundY + 20);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, groundY - 25);
      ctx.lineTo(w, groundY - 25);
      ctx.moveTo(0, groundY - 10);
      ctx.lineTo(w, groundY - 10);
      ctx.stroke();

      // 3. Draw Zone Polygons
      zones.forEach((z) => {
        if (!z.polygon_coordinates || z.polygon_coordinates.length < 3) return;
        ctx.beginPath();
        const coords = z.polygon_coordinates;
        ctx.moveTo(coords[0][0] * w, coords[0][1] * h);
        for (let i = 1; i < coords.length; i++) {
          ctx.lineTo(coords[i][0] * w, coords[i][1] * h);
        }
        ctx.closePath();
        ctx.fillStyle = isAlertActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.15)';
        ctx.fill();
        ctx.strokeStyle = isAlertActive ? '#EF4444' : '#38BDF8';
        ctx.lineWidth = isAlertActive ? 3 : 1.5;
        ctx.stroke();

        ctx.fillStyle = isAlertActive ? '#EF4444' : '#38BDF8';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(z.name || "Restricted Zone", coords[0][0] * w + 5, coords[0][1] * h - 5);
      });

      // 4. Draw Animated Walking Target #104
      const cycle = (frameCount % 200) / 200.0;
      const targetX = 80 + cycle * (w - 200);
      const targetY = groundY + 60 + cycle * 80;
      const boxH = 80 + cycle * 40;
      const boxW = boxH * 0.45;

      const bx1 = targetX - boxW / 2;
      const by1 = targetY - boxH;
      const bx2 = targetX + boxW / 2;
      const by2 = targetY;

      // Draw silhouette
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(bx1 + 4, by1 + 15, boxW - 8, boxH - 15);
      ctx.beginPath();
      ctx.arc(targetX, by1 + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw YOLO Bounding Box
      const boxColor = isAlertActive ? '#EF4444' : '#10B981';
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx1, by1, boxW, boxH);

      // Label
      ctx.fillStyle = boxColor;
      ctx.fillRect(bx1, by1 - 20, boxW, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`ID #104 (89%)`, bx1 + 3, by1 - 6);

      // Ground-anchor contact point (feet)
      ctx.beginPath();
      ctx.arc(targetX, by2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Telemetry HUD overlay
      ctx.fillStyle = 'rgba(11, 15, 23, 0.85)';
      ctx.fillRect(10, 10, 240, 50);
      ctx.strokeStyle = '#1E293B';
      ctx.strokeRect(10, 10, 240, 50);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`CAM: ${camera?.name || 'Watchtower 04'}`, 20, 28);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`RES: 1920x1080 | FPS: ${fps} | RTSP TCP`, 20, 44);

      if (isAlertActive) {
        // Red flashing alert banner across top
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText("⚠ INTRUSION ALARM ACTIVE - ZERO-LINE BARBED WIRE BUFFER BREACHED", w / 2 - 250, 19);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [camera, zones, isAlertActive, fps]);

  return (
    <div className={`relative rounded-xl overflow-hidden border ${isAlertActive ? 'border-red-500 shadow-2xl shadow-red-500/20 animate-pulse' : 'border-slate-800'} bg-black`}>
      <canvas
        ref={canvasRef}
        width={720}
        height={405}
        className="w-full h-auto block"
      />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <StatusBadge status={camera?.status || 'online'} />
      </div>
    </div>
  );
};
