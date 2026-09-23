import React from 'react';
import { Tag, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DetectionTable = ({ detections = [], isStreaming = false }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-200 font-mono tracking-wide">
            DETECTED OBJECTS LOG
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {detections.length} Active Targets
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="p-3.5">Object Class</th>
              <th className="p-3.5">Confidence Score</th>
              <th className="p-3.5">Bounding Box [X, Y, W, H]</th>
              <th className="p-3.5 text-right">Detection State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {!isStreaming ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">
                  Webcam is offline. Click <strong className="text-cyan-400">Start Camera</strong> above to begin live detection.
                </td>
              </tr>
            ) : detections.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">
                  Scanning video feed... Hold an object (phone, cup, book) or step in front of the camera.
                </td>
              </tr>
            ) : (
              detections.map((item, index) => {
                const confPercent = Math.round(item.confidence * 100);
                const [x, y, w, h] = item.bbox;

                return (
                  <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-semibold uppercase">
                        <span>{item.class}</span>
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="w-10 font-bold text-slate-200">{confPercent}%</span>
                        <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              confPercent >= 80
                                ? 'bg-emerald-400'
                                : confPercent >= 50
                                ? 'bg-cyan-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400">
                      [{x}, {y}, {w}, {h}]
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
