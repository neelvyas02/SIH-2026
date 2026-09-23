import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { authService, DEMO_ACCOUNTS } from "@/services/authService";
import { Shield, Lock, User, AlertCircle, CheckCircle2, KeyRound, Terminal } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please provide username and security passphrase");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await authService.login({ username, password });
      setSession(session);
      const targetRoute = authService.getDefaultRouteForRole(session.user.role);
      navigate({ to: targetRoute });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Operational authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreset = async (demoUser: string) => {
    setUsername(demoUser);
    setPassword("admin123");
    setLoading(true);
    setError(null);
    try {
      const session = await authService.login({ username: demoUser, password: "admin123" });
      setSession(session);
      const targetRoute = authService.getDefaultRouteForRole(session.user.role);
      navigate({ to: targetRoute });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background tactical grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--grid)/0.15)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--grid)/0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Banner Warning */}
      <div className="fixed top-0 inset-x-0 bg-secondary/80 border-b border-border/80 px-4 py-1 text-center font-mono text-[11px] text-muted-foreground flex items-center justify-center gap-2">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>OFFICIAL USE ONLY · BORDER SURVEILLANCE COMMAND SYSTEM · SECTOR WEST-9</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* IBVAP Emblem */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-xl bg-card border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/5 text-primary relative">
            <Shield className="w-9 h-9 text-primary" />
            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-black bg-primary text-primary-foreground px-1 rounded-xs">
              AI
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-display font-bold tracking-tight text-foreground text-center">
            IBVAP COMMAND CENTER
          </h1>
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase mt-1">
            Intelligent Border Video Analytics Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="mt-6 bg-card border border-border rounded-lg shadow-xl p-6 sm:p-8 backdrop-blur-xs">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-md bg-critical/15 border border-critical/30 text-critical text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-foreground uppercase tracking-wider mb-1.5">
                Personnel Call-Sign / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. operator01, commander01"
                  className="block w-full pl-9 pr-3 py-2 bg-secondary/50 border border-input rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-foreground uppercase tracking-wider mb-1.5">
                Security Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-secondary/50 border border-input rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground font-mono">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input bg-secondary text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Persist Security Token</span>
              </label>
              <button
                type="button"
                onClick={() => setError("Contact Sector Duty Officer to reset token.")}
                className="text-primary hover:underline font-mono text-[11px]"
              >
                Clearance Help?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-primary text-primary-foreground text-xs font-mono font-semibold tracking-wider uppercase hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-colors disabled:opacity-50 shadow-md shadow-primary/10"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? "Authenticating Clearance..." : "Authorize Terminal"}</span>
            </button>
          </form>

          {/* SIH Fast Demo Presets */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                SIH Fast Demo Clearance Presets:
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">PW: ibvap</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleDemoPreset(acc.username)}
                  className="flex flex-col items-start p-2 rounded border border-border/80 bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold font-mono text-foreground group-hover:text-primary">
                      {acc.label}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-muted text-muted-foreground">
                      {acc.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate w-full mt-0.5">
                    {acc.fullName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System Health Footer */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5 text-online">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kharu / Salt Flats Gateway Active</span>
          </div>
          <span>•</span>
          <span>Inference v1.4.2</span>
        </div>
      </div>
    </div>
  );
}
