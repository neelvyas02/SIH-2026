import React from 'react';

export const StatusIndicator = ({ status = 'offline' }) => {
  const configs = {
    offline: {
      dotColor: 'bg-slate-500',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-800/80 border-slate-700',
      label: 'Camera Offline',
      pulse: false,
    },
    initializing: {
      dotColor: 'bg-amber-400',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-800/60',
      label: 'Initializing Camera...',
      pulse: true,
    },
    ready: {
      dotColor: 'bg-cyan-400',
      textColor: 'text-cyan-300',
      bgColor: 'bg-cyan-950/40 border-cyan-800/60',
      label: 'Camera Ready',
      pulse: false,
    },
    detecting: {
      dotColor: 'bg-emerald-400',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800/60',
      label: 'Detecting (Live)',
      pulse: true,
    },
    error: {
      dotColor: 'bg-red-500',
      textColor: 'text-red-400',
      bgColor: 'bg-red-950/40 border-red-800/60',
      label: 'Camera Error',
      pulse: false,
    },
  };

  const config = configs[status] || configs.offline;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${config.bgColor} ${config.textColor}`}>
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}></span>
      </span>
      <span>{config.label}</span>
    </div>
  );
};
