"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  subscriptionService,
  type SubmitPaymentPayload,
} from "@/services/subscription-service";
import { weddingKeys } from "@/hooks/use-weddings";
import type { SubscriptionStatus } from "@/types/api";

export const subscriptionKeys = {
  current: (weddingId: number) =>
    ["weddings", weddingId, "subscription"] as const,
};

/** How often to re-check a payment that is awaiting admin confirmation. */
const AWAITING_POLL_MS = 3_000;

export function useSubscription(weddingId: number) {
  return useQuery({
    queryKey: subscriptionKeys.current(weddingId),
    queryFn: () => subscriptionService.current(weddingId),
    enabled: weddingId > 0,
    // While a payment sits in "submitted" (waiting for an admin to accept it),
    // poll so the couple's portal reflects the decision on its own — no manual
    // refresh. Any other status is terminal from the couple's side, so we stop
    // polling. Returning `false` disables the interval.
    refetchInterval: (query) =>
      query.state.data?.subscription?.status === "submitted"
        ? AWAITING_POLL_MS
        : false,
    // Don't poll a backgrounded tab; refetch once it's focused again instead.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Watches the wedding's subscription and, the moment an admin confirms a
 * payment that was awaiting review (submitted → paid), refreshes the wedding
 * data so the whole portal — sidebar nav and every plan-gated page — unlocks
 * automatically. A rejection (submitted → rejected) also refreshes so the plan
 * page reflects the decision.
 *
 * Mount once, high in the tree (the portal shell), so it runs on every page.
 */
export function usePlanActivationSync(weddingId: number): void {
  const queryClient = useQueryClient();
  const { data } = useSubscription(weddingId);
  const status = data?.subscription?.status;
  const previous = useRef<SubscriptionStatus | undefined>(undefined);

  useEffect(() => {
    const prev = previous.current;
    previous.current = status;

    // Only act on a real transition away from "awaiting confirmation".
    if (prev !== "submitted" || status === "submitted") return;

    if (status === "paid" || status === "rejected") {
      // weddingKeys.all (["weddings"]) is a prefix of the nested subscription
      // key, so this single invalidation refreshes the wedding (capabilities,
      // has_active_plan, payment_status) AND the plan detail in one pass.
      queryClient.invalidateQueries({ queryKey: weddingKeys.all });
    }
  }, [status, queryClient]);
}

export function useSelectPackage(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packageId: number) =>
      subscriptionService.selectPackage(weddingId, packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current(weddingId) });
      queryClient.invalidateQueries({ queryKey: ["weddings"] });
    },
  });
}

export function useSubmitPayment(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitPaymentPayload) =>
      subscriptionService.submitPayment(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current(weddingId) }),
  });
}
