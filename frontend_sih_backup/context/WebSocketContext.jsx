import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAuthToken } from '../services/api';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unackCount, setUnackCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotification, setLastNotification] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Audio chime using Web Audio API (zero audio file dependencies)
  const playAlertChime = (severity = 'critical') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = severity === 'critical' ? 'sawtooth' : 'sine';
      // Pitch: 880Hz (A5) for critical, 587Hz (D5) for high
      osc.frequency.setValueAtTime(severity === 'critical' ? 880 : 587, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(severity === 'critical' ? 440 : 330, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio playback not supported or blocked by browser:", e);
    }
  };

  const connectWebSocket = () => {
    const token = getAuthToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When using Vite dev proxy, connect to current host:5173/api/v1/ws/alerts or 8000
    const wsHost = window.location.port === '5173' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${wsHost}/api/v1/ws/alerts?token=${token || ''}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to BorderGuard AI WebSocket Gateway");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleIncomingMessage(payload);
        } catch (e) {
          console.warn("Received non-JSON websocket payload:", event.data);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Retry connection after 3s
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  };

  const handleIncomingMessage = (msg) => {
    if (msg.type === 'NEW_ALERT') {
      const newAlert = msg.data;
      setLiveAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
      setUnackCount((prev) => prev + 1);
      setLastNotification(newAlert);
      playAlertChime(newAlert.severity);
    } else if (msg.type === 'ALERT_ACKNOWLEDGED') {
      setLiveAlerts((prev) =>
        prev.map((a) => (a.alert_id === msg.data.alert_id ? { ...a, status: 'acknowledged' } : a))
      );
      setUnackCount((prev) => Math.max(0, prev - 1));
    } else if (msg.type === 'ALERT_RESOLVED') {
      setLiveAlerts((prev) =>
        prev.map((a) => (a.alert_id === msg.data.alert_id ? { ...a, status: 'resolved' } : a))
      );
    }
  };

  useEffect(() => {
    connectWebSocket();

    // Heartbeat ping every 15 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Manual Trigger for Pitch Demo
  const triggerDemoAlert = () => {
    const simulated = {
      alert_id: `sim-${Date.now()}`,
      camera_id: "b1a23e54-7890-4c12-a345-6789abcdef01",
      camera_name: "Watchtower 04 - Zero Line",
      severity: "critical",
      title: "CRITICAL INTRUSION: Zero-Line Barbed Wire Buffer",
      description: "Person breached restricted boundary at Sector 7B. Dwell duration: 2.8s. Tracking ID #104 actively logged.",
      status: "new",
      created_at: new Date().toISOString(),
      thumbnail_url: "/static/evidence/snapshots/sample_evidence_104.jpg"
    };
    handleIncomingMessage({ type: "NEW_ALERT", data: simulated });
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        liveAlerts,
        unackCount,
        soundEnabled,
        setSoundEnabled,
        lastNotification,
        setLastNotification,
        triggerDemoAlert,
        playAlertChime
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
