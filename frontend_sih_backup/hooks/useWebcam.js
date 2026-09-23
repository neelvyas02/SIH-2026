import { useState, useRef, useCallback, useEffect } from 'react';

export const useWebcam = () => {
  const [status, setStatus] = useState('offline'); // 'offline' | 'initializing' | 'ready' | 'detecting' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    setStatus('initializing');
    setErrorMessage('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setVideoDimensions({
            width: videoRef.current.videoWidth || 640,
            height: videoRef.current.videoHeight || 480,
          });
          setStatus('ready');
        };
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      let message = 'Unable to access webcam.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No webcam was detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Webcam is currently in use by another application.';
      }
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('offline');
    setErrorMessage('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    status,
    setStatus,
    errorMessage,
    videoDimensions,
    startCamera,
    stopCamera,
    isStreaming: status === 'ready' || status === 'detecting',
  };
};
