import React, { useState, useEffect } from 'react';
import { History, Download, Search, Shield, User, Car } from 'lucide-react';
import { api } from '../services/api';

export const EventHistoryPage = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (e) {
        console.warn("Could not load events:", e);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filteredEvents = events.filter((ev) =>
    ev.camera_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.target_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(ev.track_id).includes(searchTerm)
  );

  const exportCSV = () => {
    const headers = "Event ID,Camera,Zone,Track ID,Target Class,Confidence,Timestamp\n";
    const rows = filteredEvents.map(e => 
      `"${e.id}","${e.camera_name || ''}","${e.zone_name || ''}",${e.track_id},"${e.target_class}",${e.confidence_score},"${e.start_time}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borderguard_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-wide">
            FORENSIC EVENT AUDIT TRAIL
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Immutable tracking records, target trajectories, and zone containment timestamps
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by sector or track #..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Target Class</th>
                <th className="p-4">Track ID</th>
                <th className="p-4">Sector / Camera</th>
                <th className="p-4">Breached Zone</th>
                <th className="p-4">AI Confidence</th>
                <th className="p-4">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No historical events recorded matching search.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 text-cyan-300 font-semibold uppercase">
                        {ev.target_class === 'person' ? <User className="w-3 h-3 text-cyan-400" /> : <Car className="w-3 h-3 text-amber-400" />}
                        <span>{ev.target_class}</span>
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-amber-400 font-semibold">
                      #{ev.track_id}
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-200">
                      {ev.camera_name || 'Sector 7B Watchtower'}
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-400">
                      {ev.zone_name || 'Perimeter Buffer'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">
                        {Math.round(ev.confidence_score * 100)}%
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-400">
                      {new Date(ev.start_time).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
