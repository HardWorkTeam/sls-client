"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

const WEB_ORIGIN = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/$/, "");

/**
 * Embedded by sls-web in a hidden iframe. Runs first-party on the portal so it
 * can read localStorage auth even when third-party cookies are blocked between
 * sibling *.vercel.app hosts.
 */
export default function SessionStatusEmbed() {
  useEffect(() => {
    if (!WEB_ORIGIN || window.parent === window) return;

    const send = () => {
      const { token, user } = useAuthStore.getState();
      window.parent.postMessage(
        {
          type: "sls-session",
          signedIn: Boolean(token),
          name: user?.name ?? null,
        },
        WEB_ORIGIN,
      );
    };

    if (useAuthStore.persist.hasHydrated()) {
      send();
      return;
    }

    return useAuthStore.persist.onFinishHydration(send);
  }, []);

  return null;
}
