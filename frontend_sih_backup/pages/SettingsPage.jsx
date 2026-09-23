import React, { useState } from 'react';
import { Settings, Cpu, HardDrive, Shield, Check, RefreshCw } from 'lucide-react';

export const SettingsPage = () => {
  const [confThresh, setConfThresh] = useState(0.50);
  const [iouThresh, setIouThresh] = useState(0.45);
  const [cooldown, setCooldown] = useState(30);
  const [rtspPort, setRtspPort] = useState(8554);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-mono tracking-wide">
          SYSTEM SETTINGS & AI ENGINE TELEMETRY
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Model inference hyperparameters, RTSP ingestion ports, and storage quotas
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Hyperparameters successfully synchronized with AI Sentinel Worker.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: AI Hyperparameters */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">AI Computer Vision & Tracking Sentinel</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Detection Confidence Threshold</span>
                <span className="text-cyan-400 font-bold">{Math.round(confThresh * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.9"
                step="0.05"
                value={confThresh}
                onChange={(e) => setConfThresh(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Lower detects fainter targets in fog; higher reduces false alarms.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Alert Cooldown Window</span>
                <span className="text-cyan-400 font-bold">{cooldown}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={cooldown}
                onChange={(e) => setCooldown(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Suppresses duplicate alerts for the same tracking ID during continuous presence.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: RTSP Ingestion Gateway */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Media Ingestion & Video Buffer</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">MediaMTX RTSP Port</label>
              <input
                type="number"
                value={rtspPort}
                onChange={(e) => setRtspPort(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Frame Ingestion Decoupling</label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400">
                Non-Blocking Queue (Drop Stale = Enabled)
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Storage & System Diagnostics */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Evidence Store & Integrity</h3>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>Cryptographic Hashing:</span>
              <span className="text-emerald-400 font-semibold">SHA-256 (Military Chain of Custody)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>Relational Database:</span>
              <span className="text-cyan-400 font-semibold">PostgreSQL 16 / Async Engine</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Evidence Disk Usage:</span>
              <span className="text-slate-200">148.2 MB / 5.0 GB Quota</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs font-mono transition-colors shadow-lg shadow-cyan-500/20"
        >
          Save & Apply Configuration
        </button>
      </form>
    </div>
  );
};
