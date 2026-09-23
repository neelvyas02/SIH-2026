import React, { useState, useEffect } from 'react';
import { Camera, Plus, Grid2X2, Grid3X3, ArrowUpRight, Wifi, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { VideoPlayer } from '../components/surveillance/VideoPlayer';
import { StatusBadge } from '../components/common/Badge';
import { Link } from 'react-router-dom';

export const LiveCamerasPage = () => {
  const [cameras, setCameras] = useState([]);
  const [gridCols, setGridCols] = useState(2);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCam, setNewCam] = useState({
    name: '',
    location: '',
    stream_url: 'rtsp://localhost:8554/live/border1',
    stream_type: 'rtsp',
    fps: 25
  });

  const loadCameras = async () => {
    const data = await api.getCameras();
    setCameras(data);
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    await api.createCamera(newCam);
    setShowAddModal(false);
    setNewCam({ name: '', location: '', stream_url: 'rtsp://localhost:8554/live/border1', stream_type: 'rtsp', fps: 25 });
    loadCameras();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-wide">
            LIVE SURVEILLANCE MATRIX
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Direct RTSP / ONVIF feeds with real-time AI object detection overlays
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Matrix Grid Size Toggles */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setGridCols(1)}
              className={`p-1.5 rounded text-xs font-mono ${gridCols === 1 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
              title="Single View"
            >
              1x1
            </button>
            <button
              onClick={() => setGridCols(2)}
              className={`p-1.5 rounded text-xs font-mono ${gridCols === 2 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
              title="2x2 Quad View"
            >
              2x2
            </button>
            <button
              onClick={() => setGridCols(3)}
              className={`p-1.5 rounded text-xs font-mono ${gridCols === 3 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
              title="3x3 Matrix"
            >
              3x3
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Camera Feed</span>
          </button>
        </div>
      </div>

      {/* Grid of Cameras */}
      <div className={`grid gap-6 ${
        gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {cameras.map((cam) => (
          <div key={cam.id} className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-3 p-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 font-mono">{cam.name}</h3>
                <p className="text-[11px] text-slate-400">{cam.location}</p>
              </div>
              <StatusBadge status={cam.status} />
            </div>

            <VideoPlayer camera={cam} />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono px-1">
              <span className="text-slate-400">
                Zones: <span className="text-cyan-400">{cam.zone_count || 1} Restricted</span>
              </span>
              <Link
                to={`/cameras/${cam.id}`}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>Configure Zones</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-slate-100">Add Surveillance CCTV Stream</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCamera} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Camera Name</label>
                <input
                  type="text"
                  required
                  value={newCam.name}
                  onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                  placeholder="e.g. Bunker Post 14 - East Flank"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Location / Sector</label>
                <input
                  type="text"
                  required
                  value={newCam.location}
                  onChange={(e) => setNewCam({ ...newCam, location: e.target.value })}
                  placeholder="Sector 9C Border Fence"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">RTSP Stream URL</label>
                <input
                  type="text"
                  required
                  value={newCam.stream_url}
                  onChange={(e) => setNewCam({ ...newCam, stream_url: e.target.value })}
                  placeholder="rtsp://admin:pass@192.168.1.100:554/live/ch0"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Existing analog DVR/NVR channels or IP cameras supported.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Connect & Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
