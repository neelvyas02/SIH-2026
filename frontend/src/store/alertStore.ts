import { create } from "zustand";
import type { Alert } from "@/types";

export type WebSocketConnectionStatus = "connected" | "connecting" | "disconnected";

interface AlertStoreState {
  wsStatus: WebSocketConnectionStatus;
  liveAlerts: Alert[];
  unackCount: number;
  lastAlert: Alert | null;
  soundEnabled: boolean;
  setWsStatus: (status: WebSocketConnectionStatus) => void;
  setLiveAlerts: (alerts: Alert[]) => void;
  addNewAlert: (alert: Alert) => void;
  updateAlertStatusInStore: (alertId: string, status: Alert["status"]) => void;
  setSoundEnabled: (enabled: boolean) => void;
  decrementUnackCount: () => void;
}

export const useAlertStore = create<AlertStoreState>((set) => ({
  wsStatus: "disconnected",
  liveAlerts: [],
  unackCount: 0,
  lastAlert: null,
  soundEnabled: true,

  setWsStatus: (wsStatus) => set({ wsStatus }),

  setLiveAlerts: (liveAlerts) =>
    set({
      liveAlerts,
      unackCount: liveAlerts.filter((a) => a.status === "new").length,
    }),

  addNewAlert: (alert) =>
    set((state) => ({
      liveAlerts: [alert, ...state.liveAlerts.filter((a) => a.id !== alert.id)],
      unackCount: state.unackCount + (alert.status === "new" ? 1 : 0),
      lastAlert: alert,
    })),

  updateAlertStatusInStore: (alertId, status) =>
    set((state) => {
      const updated = state.liveAlerts.map((a) => (a.id === alertId ? { ...a, status } : a));
      return {
        liveAlerts: updated,
        unackCount: updated.filter((a) => a.status === "new").length,
      };
    }),

  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

  decrementUnackCount: () =>
    set((state) => ({
      unackCount: Math.max(0, state.unackCount - 1),
    })),
}));
