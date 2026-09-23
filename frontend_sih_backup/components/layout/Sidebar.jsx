import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, ShieldAlert, History, Settings, Activity } from 'lucide-react';
import { useWebSocket } from '../../context/WebSocketContext';

export const Sidebar = () => {
  const { unackCount } = useWebSocket();

  const navItems = [
    { to: '/dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { to: '/cameras', label: 'Live Cameras', icon: Camera },
    { to: '/alerts', label: 'Active Alerts', icon: ShieldAlert, badge: unackCount > 0 ? unackCount : null },
    { to: '/events', label: 'Event History', icon: History },
    { to: '/settings', label: 'Settings & AI', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0B0F17] border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-3">
          Command Matrix
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Outpost Sector Quick Stats */}
      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs space-y-2 font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI INFERENCE</span>
          </span>
          <span className="text-emerald-400">NOMINAL</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Model: <span className="text-slate-300">YOLOv8n-FP16</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Tracker: <span className="text-slate-300">ByteTrack-v2</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-cyan-400 h-full w-4/5 rounded-full animate-pulse"></div>
        </div>
        <div className="text-[10px] text-slate-500 text-right">CUDA Engine @ 72% Load</div>
      </div>
    </aside>
  );
};
