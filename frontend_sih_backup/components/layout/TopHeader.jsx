import React, { useState, useEffect } from 'react';
import { Shield, Bell, Volume2, VolumeX, Radio, Sparkles, User, LogOut } from 'lucide-react';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';

export const TopHeader = () => {
  const { isConnected, unackCount, soundEnabled, setSoundEnabled, triggerDemoAlert } = useWebSocket();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  return (
    <header className="h-16 bg-[#0B0F17] border-b border-slate-800/80 px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wider text-slate-100 font-mono">
              BORDERGUARD <span className="text-cyan-400">AI</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              DEFENCE SENTINEL
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Border Surveillance Operations Command</p>
        </div>
      </div>

      {/* Center Telemetry & UTC Time */}
      <div className="hidden md:flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-slate-300">
            AI GATEWAY: {isConnected ? 'LINKED (25 FPS)' : 'OFFLINE (STANDALONE)'}
          </span>
        </div>

        <div className="text-slate-400 flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Actions & Operator Profile */}
      <div className="flex items-center gap-3">
        {/* Instant Demo Simulation Button for SIH Judges */}
        <button
          onClick={triggerDemoAlert}
          title="Trigger a simulated intrusion breach to showcase live WebSocket alert ingestion"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-red-600/20 to-amber-600/20 hover:from-red-600/30 hover:to-amber-600/30 text-red-300 border border-red-500/40 transition-all shadow-sm shadow-red-500/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono">Simulate Breach</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Mute audio alarms" : "Unmute audio alarms"}
          className={`p-2 rounded-md border transition-colors ${
            soundEnabled
              ? 'bg-slate-800/80 border-slate-700 text-cyan-400'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Alert Bell */}
        <div className="relative">
          <div className="p-2 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <Bell className="w-4 h-4" />
          </div>
          {unackCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold font-mono animate-bounce">
              {unackCount}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="font-medium text-slate-200">{user?.full_name || 'Inspector Sharma'}</div>
            <div className="text-[10px] text-cyan-400 font-mono uppercase">{user?.role || 'OPERATOR'}</div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
