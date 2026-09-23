import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@/types";
import { setAuthToken } from "@/lib/apiClient";

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  logout: () => void;
  user: () => User | null;
}

function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ibvap.auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = parsed?.state?.session ?? null;
    if (session?.token) {
      setAuthToken(session.token);
    }
    return session;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: getStoredSession(),
      hydrated: true,
      setSession: (session) => {
        setAuthToken(session?.token ?? null);
        set({ session, hydrated: true });
      },
      logout: () => {
        setAuthToken(null);
        set({ session: null, hydrated: true });
      },
      user: () => get().session?.user ?? null,
    }),
    {
      name: "ibvap.auth",
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        setAuthToken(state?.session?.token ?? null);
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);
