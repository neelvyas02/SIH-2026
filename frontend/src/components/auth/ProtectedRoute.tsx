import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "@tanstack/react-router";
import type { Role } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, hydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !session) {
      navigate({ to: "/login" });
    }
  }, [session, hydrated, navigate]);

  // While Zustand rehydrates from localStorage
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>INITIALIZING IBVAP SECURITY ENVIRONMENT...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Check role authorization if restricted
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return (
      <AppShell>
        <div className="py-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div className="p-4 rounded-full bg-critical/15 text-critical border border-critical/30 mb-4">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Clearance Level Insufficient
          </h2>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            This module requires authorization level [{allowedRoles.join(" | ")}]. Current clearance: [{session.user.role}].
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-foreground text-xs font-mono font-medium hover:bg-secondary/80 border border-border"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Command Center</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
