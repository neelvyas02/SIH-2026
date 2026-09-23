import React, { useRef, useEffect } from 'react';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { DetectionOverlay } from './DetectionOverlay';
import { detectObjectsFromFrame } from '../services/detectionService';

export const CameraPanel = ({
  videoRef,
  status,
  setStatus,
  errorMessage,
  videoDimensions,
  detections,
  setDetections,
  setLatencyMs,
  onStart,
}) => {
  const isStreaming = status === 'ready' || status === 'detecting';
  const processingRef = useRef(false);
  const captureCanvasRef = useRef(null);

  // Initialize offscreen capture canvas
  useEffect(() => {
    captureCanvasRef.current = document.createElement('canvas');
  }, []);

  // Continuous frame detection loop
  useEffect(() => {
    let timerId;

    const processFrame = async () => {
      if (!isStreaming || !videoRef.current || processingRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) return; // HAVE_CURRENT_DATA

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const canvas = captureCanvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      processingRef.current = true;
      setStatus('detecting');
      const startTime = performance.now();

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            processingRef.current = false;
            return;
          }

          try {
            const data = await detectObjectsFromFrame(blob);
            const elapsed = performance.now() - startTime;
            setLatencyMs(elapsed);

            if (data && data.detections) {
              setDetections(data.detections);
            }
          } catch (err) {
            console.warn('Frame detection call failed:', err.message);
          } finally {
            processingRef.current = false;
          }
        },
        'image/jpeg',
        0.75
      );
    };

    if (isStreaming) {
      // Run detection every 150ms (~6.6 FPS) for smooth UI with low backend load
      timerId = setInterval(processFrame, 150);
    } else {
      setDetections([]);
      setLatencyMs(0);
    }

    return () => {
      if (timerId) clearInterval(timerId);
      processingRef.current = false;
    };
  }, [isStreaming, videoRef, setStatus, setDetections, setLatencyMs]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-[4/3] sm:aspect-video flex items-center justify-center">
      {/* 1. Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isStreaming ? 'opacity-100' : 'opacity-0 absolute'
        }`}
      />

      {/* 2. Real-Time Detection Bounding Boxes Canvas Overlay */}
      {isStreaming && (
        <DetectionOverlay
          detections={detections}
          width={videoDimensions.width}
          height={videoDimensions.height}
        />
      )}

      {/* 3. Offline / Idle Placeholder */}
      {!isStreaming && status !== 'error' && status !== 'initializing' && (
        <div className="text-center p-8 space-y-4 max-w-md z-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-base font-semibold text-slate-200">
              Webcam Feed Offline
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Allow browser camera permissions to begin real-time YOLO object detection.
            </p>
          </div>
          <button
            onClick={onStart}
            className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            Start Laptop Camera
          </button>
        </div>
      )}

      {/* 4. Initializing State */}
      {status === 'initializing' && (
        <div className="text-center p-8 space-y-3 z-20">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <div className="font-mono text-xs text-cyan-300">
            Requesting camera permissions & initializing feed...
          </div>
        </div>
      )}

      {/* 5. Permission / Camera Error Alert */}
      {status === 'error' && (
        <div className="text-center p-8 space-y-4 max-w-md z-20">
          <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-base font-semibold text-red-300">
              Camera Access Denied
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              {errorMessage || 'Browser camera permission was not granted.'}
            </p>
          </div>
          <button
            onClick={onStart}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Live Badge in Top-Left when Streaming */}
      {isStreaming && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200">LAPTOP WEBCAM</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400">{videoDimensions.width}x{videoDimensions.height}</span>
        </div>
      )}
    </div>
  );
};
