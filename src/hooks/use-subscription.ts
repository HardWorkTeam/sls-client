"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionService,
  type SubmitPaymentPayload,
} from "@/services/subscription-service";

export const subscriptionKeys = {
  current: (weddingId: number) =>
    ["weddings", weddingId, "subscription"] as const,
};

export function useSubscription(weddingId: number) {
  return useQuery({
    queryKey: subscriptionKeys.current(weddingId),
    queryFn: () => subscriptionService.current(weddingId),
    enabled: weddingId > 0,
  });
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
