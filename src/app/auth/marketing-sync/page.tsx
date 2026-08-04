"use client";

import { PageLoader } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const WEB_ORIGIN = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/$/, "");

function safeReturnUrl(raw: string | null): string | null {
  if (!raw || !WEB_ORIGIN) return null;
  try {
    const url = new URL(raw);
    if (url.origin !== WEB_ORIGIN) return null;
    if (url.pathname !== "/auth/synced") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function MarketingSyncInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const returnUrl = safeReturnUrl(searchParams.get("return"));
    if (!returnUrl) {
      window.location.replace(WEB_ORIGIN ?? "/");
      return;
    }

    const redirect = () => {
      const { token, user } = useAuthStore.getState();
      const target = new URL(returnUrl);

      if (token && user) {
        target.searchParams.set("signedIn", "1");
        if (user.name) target.searchParams.set("name", user.name);
      } else {
        target.searchParams.set("signedIn", "0");
      }

      window.location.replace(target.toString());
    };

    if (useAuthStore.persist.hasHydrated()) {
      redirect();
      return;
    }

    return useAuthStore.persist.onFinishHydration(redirect);
  }, [searchParams]);

  return <PageLoader label="Syncing session..." />;
}

/**
 * Top-level redirect bridge used by sls-web on sibling *.vercel.app hosts.
 * Runs first-party here so localStorage auth is readable, then sends the user
 * back to the marketing site with a short-lived query hint.
 */
export default function MarketingSyncPage() {
  return (
    <Suspense fallback={<PageLoader label="Syncing session..." />}>
      <MarketingSyncInner />
    </Suspense>
  );
}
