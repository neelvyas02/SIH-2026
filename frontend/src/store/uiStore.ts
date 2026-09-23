import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface UiState {
  sidebarCollapsed: boolean;
  theme: Theme;
  simulatorRunning: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setSimulatorRunning: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: "dark",
      simulatorRunning: true,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setSimulatorRunning: (simulatorRunning) => set({ simulatorRunning }),
    }),
    { name: "ibvap.ui" },
  ),
);
