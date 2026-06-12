"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rsvpService } from "@/services/rsvp-service";
import type { RsvpResponse } from "@/types/api";

export const rsvpKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "rsvps"] as const,
  list: (weddingId: number, params: object) =>
    ["weddings", weddingId, "rsvps", "list", params] as const,
  stats: (weddingId: number) => ["weddings", weddingId, "rsvps", "stats"] as const,
};

export function useRsvps(
  weddingId: number,
  params: { status?: string; search?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: rsvpKeys.list(weddingId, params),
    queryFn: () => rsvpService.list(weddingId, params),
    enabled: weddingId > 0,
  });
}

export function useRsvpStats(weddingId: number) {
  return useQuery({
    queryKey: rsvpKeys.stats(weddingId),
    queryFn: () => rsvpService.stats(weddingId),
    enabled: weddingId > 0,
  });
}

export function useUpdateRsvp(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rsvpId,
      payload,
    }: {
      rsvpId: number;
      payload: Partial<
        Pick<RsvpResponse, "guest_name" | "phone" | "number_of_guests" | "message" | "status">
      >;
    }) => rsvpService.update(weddingId, rsvpId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rsvpKeys.all(weddingId) }),
  });
}

export function useDeleteRsvp(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rsvpId: number) => rsvpService.remove(weddingId, rsvpId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rsvpKeys.all(weddingId) }),
  });
}
