import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/api";
import { clearSessionCookie, writeSessionCookie } from "@/lib/session-cookie";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        // Mirror the signed-in state to the marketing site (separate origin).
        writeSessionCookie(user?.name ?? "");
        set({ token, user });
      },
      setUser: (user) => {
        writeSessionCookie(user?.name ?? "");
        set({ user });
      },
      clear: () => {
        clearSessionCookie();
        set({ token: null, user: null });
      },
      hasRole: (...roles) =>
        (get().user?.roles ?? []).some((role) => roles.includes(role.key)),
    }),
    {
      name: "client_auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Read the token outside React (axios interceptor). */
export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

