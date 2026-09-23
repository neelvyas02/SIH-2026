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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      hydrated: false,
      setSession: (session) => {
        setAuthToken(session?.token ?? null);
        set({ session });
      },
      logout: () => {
        setAuthToken(null);
        set({ session: null });
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
