import React from 'react';
import { Target, Activity, Cpu, Camera, Clock } from 'lucide-react';

export const DetectionStats = ({ detectionsCount = 0, isDetecting = false, latencyMs = 0 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Stat 1: Objects Count */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Objects Detected
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {detectionsCount}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Real-Time Bounding Boxes</p>
        </div>
        <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <Target className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 2: Processing Status */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Inference Status
          </span>
          <div className={`text-base font-bold font-mono ${isDetecting ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isDetecting ? 'ACTIVE' : 'IDLE'}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {isDetecting ? 'Continuous Pipeline' : 'Awaiting Video'}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg border ${
          isDetecting ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 3: Model Architecture */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            AI Engine Model
          </span>
          <div className="text-base font-bold font-mono text-slate-200">
            YOLOv8 Nano
          </div>
          <p className="text-[10px] text-slate-500 font-mono">COCO 80-Class Weights</p>
        </div>
        <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Cpu className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 4: Hardware & Latency */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Source & Speed
          </span>
          <div className="text-base font-bold font-mono text-slate-200">
            {latencyMs > 0 ? `${latencyMs.toFixed(0)} ms` : 'Laptop Cam'}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {latencyMs > 0 ? 'Round-Trip Latency' : 'Direct MediaStream'}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
          {latencyMs > 0 ? <Clock className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
};
