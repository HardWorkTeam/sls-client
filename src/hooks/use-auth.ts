"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";

// API tokens live for 6 hours (SANCTUM_EXPIRATION). Renew every 5 hours so a
// signed-in couple stays signed in, keeping a 1-hour safety margin before the
// server would reject the token. A failed renewal 401s and the axios
// interceptor clears the session and redirects to login.
const SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 60 * 1000;

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => setAuth(data.token, data.user),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => setAuth(data.token, data.user),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authService.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authService.resetPassword });
}

export function useLogout() {
  const clear = useAuthStore((state) => state.clear);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout().catch(() => undefined),
    onSettled: () => {
      clear();
      queryClient.clear();
      router.replace("/");
    },
  });
}

export function useMe(enabled = true) {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const user = await authService.me();
      setUser(user);
      return user;
    },
    enabled: enabled && Boolean(token),
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: authService.changePassword });
}

/**
 * Keep the session alive by silently rotating the bearer token before it
 * expires. Mount once inside the authenticated shell. Renews on a 5-hour
 * interval and also when the tab regains focus after being idle long enough
 * to risk expiry (background tabs throttle timers).
 */
export function useSessionRefresh() {
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let lastRefresh = Date.now();

    const renew = async () => {
      try {
        const data = await authService.refresh();
        if (!cancelled) {
          setAuth(data.token, data.user);
          lastRefresh = Date.now();
        }
      } catch {
        // A 401 is handled globally by the axios response interceptor
        // (clears the session and redirects to login); nothing to do here.
      }
    };

    const interval = window.setInterval(renew, SESSION_REFRESH_INTERVAL_MS);

    const onFocus = () => {
      if (Date.now() - lastRefresh >= SESSION_REFRESH_INTERVAL_MS) renew();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // `token` changes after each successful renewal, which restarts the timer
    // — exactly the sliding-window behaviour we want.
  }, [token, setAuth]);
}
