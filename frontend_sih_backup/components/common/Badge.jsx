import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

export const SeverityBadge = ({ severity = 'medium', className = '' }) => {
  const configs = {
    critical: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/40',
      icon: ShieldAlert,
      label: 'CRITICAL',
    },
    high: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
      icon: AlertTriangle,
      label: 'HIGH WARNING',
    },
    medium: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/40',
      icon: AlertCircle,
      label: 'MEDIUM',
    },
    low: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
      icon: Info,
      label: 'LOW ADVISORY',
    },
  };

  const config = configs[severity.toLowerCase()] || configs.medium;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${config.bg} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};

export const StatusBadge = ({ status = 'online', className = '' }) => {
  const isOnline = status.toLowerCase() === 'online';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
      isOnline 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
        : 'bg-red-500/10 text-red-400 border-red-500/30'
    } ${className}`}>
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span className="uppercase">{status}</span>
    </span>
  );
};
