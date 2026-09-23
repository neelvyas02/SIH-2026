import React from 'react';
import { Play, Square } from 'lucide-react';

export const CameraControls = ({ isStreaming, onStart, onStop, disabled = false }) => {
  return (
    <div className="flex items-center gap-2">
      {!isStreaming ? (
        <button
          id="btn-start-camera"
          onClick={onStart}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Camera</span>
        </button>
      ) : (
        <button
          id="btn-stop-camera"
          onClick={onStop}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop Camera</span>
        </button>
      )}
    </div>
  );
};
