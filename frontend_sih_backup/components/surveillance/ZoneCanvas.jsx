import React, { useRef, useState, useEffect } from 'react';
import { Plus, Trash2, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { SeverityBadge } from '../common/Badge';

export const ZoneCanvas = ({ onSaveZone, existingZones = [], cameraName = "Sector 7B" }) => {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [zoneName, setZoneName] = useState("Restricted Perimeter Buffer");
  const [severity, setSeverity] = useState("critical");
  const [dwellTime, setDwellTime] = useState(2);
  const [isDrawing, setIsDrawing] = useState(true);

  const canvasWidth = 800;
  const canvasHeight = 450;

  // Redraw canvas whenever points or existing zones change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. Clear background
    ctx.fillStyle = '#101827';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw mock terrain grid and surveillance camera scene
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < canvasHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Horizon line
    const horizon = canvasHeight * 0.45;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(canvasWidth, horizon);
    ctx.stroke();

    // Fence posts
    for (let x = 40; x < canvasWidth; x += 80) {
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, horizon - 50);
      ctx.lineTo(x, horizon + 30);
      ctx.stroke();
    }

    // 3. Draw existing zones
    existingZones.forEach((z) => {
      if (!z.polygon_coordinates || z.polygon_coordinates.length < 3) return;
      ctx.beginPath();
      const coords = z.polygon_coordinates;
      ctx.moveTo(coords[0][0] * canvasWidth, coords[0][1] * canvasHeight);
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i][0] * canvasWidth, coords[i][1] * canvasHeight);
      }
      ctx.closePath();
      ctx.fillStyle = z.severity_level === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
      ctx.fill();
      ctx.strokeStyle = z.severity_level === 'critical' ? '#EF4444' : '#F59E0B';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label tag
      const first = coords[0];
      ctx.fillStyle = '#EF4444';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(z.name || "Zone", first[0] * canvasWidth + 5, first[1] * canvasHeight - 5);
    });

    // 4. Draw active polygon being created
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0][0] * canvasWidth, points[0][1] * canvasHeight);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * canvasWidth, points[i][1] * canvasHeight);
      }

      if (points.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = severity === 'critical' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
      }

      ctx.strokeStyle = severity === 'critical' ? '#EF4444' : '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw vertex handles
      points.forEach(([nx, ny], idx) => {
        const px = nx * canvasWidth;
        const py = ny * canvasHeight;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#10B981' : (severity === 'critical' ? '#EF4444' : '#38BDF8');
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`P${idx + 1}`, px + 8, py - 6);
      });
    }

    // Telemetry text overlay
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText(`CAMERA: ${cameraName} | INTERACTIVE RESTRICTED ZONE CANVAS`, 15, 25);
    if (points.length < 3) {
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(`Click on video canvas to place polygon vertices (Min: 3 points). Current: ${points.length}`, 15, canvasHeight - 15);
    } else {
      ctx.fillStyle = '#10B981';
      ctx.fillText(`Polygon ready (${points.length} vertices). Fill out parameters on the right and click Save.`, 15, canvasHeight - 15);
    }
  }, [points, existingZones, severity, cameraName]);

  const handleCanvasClick = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const normX = parseFloat((clickX / canvasWidth).toFixed(3));
    const normY = parseFloat((clickY / canvasHeight).toFixed(3));

    setPoints((prev) => [...prev, [normX, normY]]);
  };

  const handleReset = () => {
    setPoints([]);
  };

  const handleSave = () => {
    if (points.length < 3) {
      alert("A polygon restricted zone must have at least 3 vertices.");
      return;
    }

    const newZone = {
      name: zoneName,
      zone_type: "restricted",
      severity_level: severity,
      dwell_time_threshold: dwellTime,
      polygon_coordinates: points,
      is_active: true
    };

    onSaveZone(newZone);
    setPoints([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas Area */}
      <div className="lg:col-span-2 space-y-3">
        <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleCanvasClick}
            className="w-full h-auto cursor-crosshair block"
          />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 backdrop-blur-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Normalized Vertices Preview Bar */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
          <div className="text-slate-400">
            Vertices: {points.length === 0 ? "None defined" : points.map((p, i) => `[${p[0]}, ${p[1]}]`).join(', ')}
          </div>
          <span className="text-cyan-400 font-semibold">{points.length} Points</span>
        </div>
      </div>

      {/* Configuration Form Panel */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-200">Zone Parameters</h3>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Zone Identifier / Name</label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              placeholder="e.g. Zero-Line Barbed Wire"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Hazard Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="critical">CRITICAL (Immediate Alarm & Siren)</option>
              <option value="high">HIGH (Urgent Warning)</option>
              <option value="medium">MEDIUM (Advisory Monitor)</option>
              <option value="low">LOW (Audit Telemetry)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Dwell Time Threshold</span>
              <span className="text-cyan-400 font-bold">{dwellTime}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={dwellTime}
              onChange={(e) => setDwellTime(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Target must dwell continuously inside polygon for {dwellTime}s before generating an alarm.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
            <div className="text-slate-300 font-semibold">Spatial Analysis Logic:</div>
            <div>• Anchor: <span className="text-cyan-400">Bottom-Center (Feet)</span></div>
            <div>• Anti-Flapping: <span className="text-cyan-400">30s Track Debounce</span></div>
            <div>• Engine: <span className="text-cyan-400">Shapely Polygon Raycast</span></div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={points.length < 3}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            points.length >= 3
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Activate Restricted Zone</span>
        </button>
      </div>
    </div>
  );
};
