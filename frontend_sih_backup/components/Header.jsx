import React from 'react';
import { Shield } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { CameraControls } from './CameraControls';

export const Header = ({ status, onStart, onStop }) => {
  const isStreaming = status === 'ready' || status === 'detecting';

  return (
    <header className="bg-[#0B0F17] border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-wider text-slate-100 font-mono">
              BORDERGUARD <span className="text-cyan-400">AI</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              MVP 1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Live Object Detection using Laptop Webcam
          </p>
        </div>
      </div>

      {/* Status & Camera Controls */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <StatusIndicator status={status} />

        <CameraControls
          isStreaming={isStreaming}
          onStart={onStart}
          onStop={onStop}
        />
      </div>
    </header>
  );
};
