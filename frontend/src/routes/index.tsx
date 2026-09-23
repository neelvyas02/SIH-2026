import React, { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, hydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) {
      const timer = setTimeout(() => {
        useAuthStore.setState({ hydrated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (session) {
      const target = authService.getDefaultRouteForRole(session.user.role);
      navigate({ to: target });
    } else {
      navigate({ to: "/login" });
    }
  }, [session, hydrated, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
        <span>CONNECTING TO IBVAP TACTICAL NETWORK...</span>
      </div>
    </div>
  );
}
