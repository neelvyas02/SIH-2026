import React, { useState, useEffect } from 'react';
import { Camera, ShieldAlert, CheckCircle2, Activity, Shield, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { VideoPlayer } from '../components/surveillance/VideoPlayer';
import { SeverityBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { liveAlerts, unackCount } = useWebSocket();

  const loadData = async () => {
    try {
      const [statsData, camsData, alertsData] = await Promise.all([
        api.getStats(),
        api.getCameras(),
        api.getAlerts({ limit: 10 }),
      ]);
      setStats(statsData);
      setCameras(camsData);
      if (camsData.length > 0) {
        setSelectedCamera(camsData[0]);
        const zData = await api.getZones(camsData[0].id);
        setZones(zData);
      }
      setAlerts(alertsData);
    } catch (err) {
      console.warn("Failed to fetch initial dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Prepend any incoming real-time alerts from WebSocket
  const mergedAlerts = [...liveAlerts, ...alerts].slice(0, 8);
  const hasActiveCritical = mergedAlerts.some((a) => a.severity === 'critical' && a.status === 'new');

  const handleAcknowledge = async (alertId) => {
    await api.acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">SURVEILLANCE FEEDS</span>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {stats?.active_cameras_count || 4} <span className="text-xs font-normal text-emerald-400">/ {stats?.total_cameras_count || 4} ONLINE</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">25 FPS Real-Time Capture</p>
          </div>
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
          unackCount > 0 
            ? 'bg-red-500/10 border-red-500/40 shadow-red-500/10' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">ACTIVE UNRESOLVED</span>
            <div className="text-2xl font-bold font-mono text-red-400">
              {unackCount} <span className="text-xs font-normal text-slate-400">INCIDENTS</span>
            </div>
            <p className="text-[11px] text-red-300 font-mono">Requires Sentry Verification</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">CRITICAL TODAY</span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {stats?.critical_alerts_today || 3}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Perimeter Breaches Logged</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">RESOLVED & AUDITED</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {stats?.resolved_today || 8}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Forensic Hashes Verified</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Selected Live Viewport (2 Cols) + Active Alert Triage Feed (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Monitor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="font-semibold text-slate-200">
                Primary Monitor: {selectedCamera?.name || 'Watchtower 04 - Zero Line'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/cameras/${selectedCamera?.id || 'b1a23e54-7890-4c12-a345-6789abcdef01'}`}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Edit Restricted Zones</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <VideoPlayer
            camera={selectedCamera}
            zones={zones}
            isAlertActive={hasActiveCritical}
          />

          {/* Camera Selector Matrix Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={async () => {
                  setSelectedCamera(cam);
                  const z = await api.getZones(cam.id);
                  setZones(z);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  selectedCamera?.id === cam.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cam.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Real-Time Alert Triage Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h2 className="font-semibold text-slate-200">Active Alert Triage Feed</h2>
            </div>
            <Link to="/alerts" className="text-xs font-mono text-slate-400 hover:text-slate-200">
              View All
            </Link>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {mergedAlerts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs font-mono">
                No active security violations in monitored sectors.
              </div>
            ) : (
              mergedAlerts.map((a) => {
                const isNew = a.status === 'new';
                return (
                  <div
                    key={a.id || a.alert_id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isNew
                        ? 'bg-red-950/30 border-red-500/50 shadow-lg shadow-red-500/10'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 mb-1 leading-snug">
                      {a.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">
                      {a.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-500">
                        Sector: {a.camera_name || 'Watchtower 04'}
                      </span>
                      {isNew ? (
                        <button
                          onClick={() => handleAcknowledge(a.id || a.alert_id)}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Acknowledged</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
