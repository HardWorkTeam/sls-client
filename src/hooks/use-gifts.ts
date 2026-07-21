"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { giftService, type GiftPayload } from "@/services/gift-service";

export const giftKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "gifts"] as const,
  list: (weddingId: number, params: object) =>
    ["weddings", weddingId, "gifts", "list", params] as const,
  summary: (weddingId: number) => ["weddings", weddingId, "gifts", "summary"] as const,
};

export function useGifts(
  weddingId: number,
  params: { gift_type?: string; search?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: giftKeys.list(weddingId, params),
    queryFn: () => giftService.list(weddingId, params),
    enabled: weddingId > 0,
  });
}

export function useGiftSummary(weddingId: number) {
  return useQuery({
    queryKey: giftKeys.summary(weddingId),
    queryFn: () => giftService.summary(weddingId),
    enabled: weddingId > 0,
  });
}

export function useCreateGift(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GiftPayload) => giftService.create(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: giftKeys.all(weddingId) }),
  });
}

export function useUpdateGift(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, payload }: { giftId: number; payload: GiftPayload }) =>
      giftService.update(weddingId, giftId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: giftKeys.all(weddingId) }),
  });
}

export function useDeleteGift(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (giftId: number) => giftService.remove(weddingId, giftId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: giftKeys.all(weddingId) }),
  });
}
