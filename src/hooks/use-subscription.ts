"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription-service";

export const subscriptionKeys = {
  detail: (weddingId: number) => ["weddings", weddingId, "subscription"] as const,
};

export function useSubscription(weddingId: number) {
  return useQuery({
    queryKey: subscriptionKeys.detail(weddingId),
    queryFn: () => subscriptionService.get(weddingId),
    enabled: weddingId > 0,
  });
}

export function useSelectPackage(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packageId: number) =>
      subscriptionService.select(weddingId, packageId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(weddingId),
      }),
  });
}

export function useSubmitPayment(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      payment_method: string;
      payment_reference?: string | null;
    }) => subscriptionService.pay(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(weddingId),
      }),
  });
}
