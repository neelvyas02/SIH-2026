import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Camera, ShieldAlert, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { ZoneCanvas } from '../components/surveillance/ZoneCanvas';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';

export const CameraDetailPage = () => {
  const { id } = useParams();
  const [camera, setCamera] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadCameraAndZones = async () => {
    try {
      const [camData, zonesData] = await Promise.all([
        api.getCamera(id),
        api.getZones(id)
      ]);
      setCamera(camData);
      setZones(zonesData);
    } catch (e) {
      console.warn("Could not load camera detail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameraAndZones();
  }, [id]);

  const handleSaveZone = async (newZoneData) => {
    try {
      const created = await api.createZone(id, newZoneData);
      setZones((prev) => [...prev, created]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save restricted zone: " + e.message);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("Are you sure you want to deactivate this restricted zone?")) return;
    try {
      await api.deleteZone(zoneId);
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    } catch (e) {
      console.warn("Delete zone failed:", e);
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/cameras"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                {camera?.name || 'Surveillance Sector'}
              </h1>
              <StatusBadge status={camera?.status || 'online'} />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {camera?.location} • {camera?.stream_url}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zone Activated into AI Engine</span>
          </div>
        )}
      </div>

      {/* Interactive Zone Configuration Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-400">
            Interactive Video Calibration & Polygon Tripwires
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            Click points directly on video frame to define restricted boundaries
          </span>
        </div>

        <ZoneCanvas
          cameraName={camera?.name}
          existingZones={zones}
          onSaveZone={handleSaveZone}
        />
      </div>

      {/* Active Zones List */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase">
          Configured Perimeter Zones ({zones.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm">{zone.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    Type: {zone.zone_type}
                  </span>
                </div>
                <SeverityBadge severity={zone.severity_level} />
              </div>

              <div className="text-xs font-mono text-slate-400 space-y-1">
                <div>Dwell Threshold: <span className="text-slate-200">{zone.dwell_time_threshold}s</span></div>
                <div>Vertices: <span className="text-slate-200">{zone.polygon_coordinates?.length || 4} Points</span></div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Zone</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
