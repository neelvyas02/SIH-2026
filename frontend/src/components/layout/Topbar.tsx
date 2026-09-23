import React, { useState, useEffect } from "react";
import { Search, Sun, Moon, Play, Pause, ShieldAlert, Cpu } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { LiveClock } from "@/components/common/LiveClock";

export function Topbar() {
  const { theme, toggleTheme, simulatorRunning, setSimulatorRunning } = useUiStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 border-b border-border bg-card/95 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
        {/* Left: Sector Badge & Search Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-mono font-black text-sm tracking-wider">
              IB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-wide text-foreground">
                  IBVAP
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/30 uppercase font-semibold">
                  SECTOR WEST-9
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono leading-none hidden sm:block">
                INTELLIGENT BORDER VIDEO ANALYTICS PLATFORM
              </p>
            </div>
          </div>

          {/* Quick Search Bar button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 hover:bg-secondary/90 border border-border/60 text-xs text-muted-foreground transition-colors w-64 lg:w-72"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left font-mono">Global search (P102, CAM-03)...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-card border border-border rounded text-muted-foreground">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Operational Telemetry & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-accent/40 border border-border/40 text-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* System Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-online/30 bg-online/10 text-online font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-online animate-pulse" />
            <span>AI INFERENCE ONLINE</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-foreground/90 font-medium">7/8 STREAMS</span>
          </div>

          {/* Live Clock */}
          <div className="hidden xl:block">
            <LiveClock />
          </div>

          {/* Simulation Toggle */}
          <button
            onClick={() => setSimulatorRunning(!simulatorRunning)}
            title={simulatorRunning ? "Pause Real-time Event Simulator" : "Resume Real-time Event Simulator"}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
              simulatorRunning
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SIM:</span>
            <span className="font-semibold uppercase">{simulatorRunning ? "ACTIVE" : "PAUSED"}</span>
          </button>

          {/* Notifications Dropdown */}
          <NotificationPanel />

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Operational Theme"}
            className="p-2 rounded-md hover:bg-accent/40 border border-border/40 text-foreground transition-colors focus:outline-hidden"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>

          {/* User Profile Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
