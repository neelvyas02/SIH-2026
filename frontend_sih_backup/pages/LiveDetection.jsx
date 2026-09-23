import React, { useState } from 'react';
import { Header } from '../components/Header';
import { CameraPanel } from '../components/CameraPanel';
import { DetectionStats } from '../components/DetectionStats';
import { DetectionTable } from '../components/DetectionTable';
import { useWebcam } from '../hooks/useWebcam';

export const LiveDetection = () => {
  const {
    videoRef,
    status,
    setStatus,
    errorMessage,
    videoDimensions,
    startCamera,
    stopCamera,
    isStreaming,
  } = useWebcam();

  const [detections, setDetections] = useState([]);
  const [latencyMs, setLatencyMs] = useState(0);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Header with Controls */}
      <Header
        status={status}
        onStart={startCamera}
        onStop={stopCamera}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-semibold tracking-wider text-slate-300 uppercase">
              Live Video Analytics
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Webcam video frame streaming to YOLOv8 object detection engine
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Target Resolution: <span className="text-cyan-400 font-semibold">{videoDimensions.width}x{videoDimensions.height}</span>
          </div>
        </div>

        {/* 3. Main Webcam Video & Bounding Box Overlay */}
        <CameraPanel
          videoRef={videoRef}
          status={status}
          setStatus={setStatus}
          errorMessage={errorMessage}
          videoDimensions={videoDimensions}
          detections={detections}
          setDetections={setDetections}
          setLatencyMs={setLatencyMs}
          onStart={startCamera}
        />

        {/* 4. Telemetry Metric Cards */}
        <DetectionStats
          detectionsCount={detections.length}
          isDetecting={status === 'detecting'}
          latencyMs={latencyMs}
        />

        {/* 5. Real-Time Detected Objects Table */}
        <DetectionTable
          detections={detections}
          isStreaming={isStreaming}
        />
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs font-mono text-slate-600">
        BorderGuard AI • Single-Feature MVP • Smart India Hackathon Prototype
      </footer>
    </div>
  );
};

export default LiveDetection;
