import React, { useEffect, useRef } from 'react';

export const DetectionOverlay = ({ detections = [], width = 640, height = 480 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear previous frame annotations
    ctx.clearRect(0, 0, width, height);

    if (!detections || detections.length === 0) return;

    detections.forEach((item) => {
      const [x, y, w, h] = item.bbox;
      const label = `${item.class.toUpperCase()} ${Math.round(item.confidence * 100)}%`;

      // 1. Draw Bounding Box (Vibrant Cyan)
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      // 2. Draw Corner Accents
      const cornerLength = Math.min(16, w / 4, h / 4);
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 4;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLength);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLength);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cornerLength, y + h);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cornerLength);
      ctx.stroke();

      // 3. Draw Label Tag
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(label).width;
      const tagHeight = 22;
      const tagY = Math.max(0, y - tagHeight);

      // Label background pill
      ctx.fillStyle = 'rgba(11, 15, 23, 0.9)';
      ctx.fillRect(x, tagY, textWidth + 14, tagHeight);

      // Label border
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, tagY, textWidth + 14, tagHeight);

      // Label text
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(label, x + 7, tagY + 15);
    });
  }, [detections, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
};
