"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invitationService,
  type InvitationPayload,
} from "@/services/invitation-service";

export const invitationKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "invitations"] as const,
};

export function useInvitations(weddingId: number) {
  return useQuery({
    queryKey: invitationKeys.all(weddingId),
    queryFn: () => invitationService.list(weddingId),
    enabled: weddingId > 0,
  });
}

export function useCreateInvitation(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvitationPayload) =>
      invitationService.create(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.all(weddingId) }),
  });
}

export function useUpdateInvitation(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      payload,
    }: {
      invitationId: number;
      payload: InvitationPayload & { status?: string };
    }) => invitationService.update(weddingId, invitationId, payload),
    onSuccess: (updatedInvitation) => {
      // Write the server's response into the cache immediately so consumers
      // see the correct saved data right away — no waiting for the background
      // refetch to complete.
      queryClient.setQueryData(
        invitationKeys.all(weddingId),
        (old: import("@/types/api").Invitation[] | undefined) =>
          old?.map((inv) =>
            inv.id === updatedInvitation.id ? updatedInvitation : inv,
          ) ?? [updatedInvitation],
      );
      // Still invalidate so a background refetch eventually brings in any
      // server-side changes (published_at, etc.).
      queryClient.invalidateQueries({ queryKey: invitationKeys.all(weddingId) });
    },
  });
}

export function usePublishInvitation(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      invitationService.publish(weddingId, invitationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.all(weddingId) }),
  });
}

export function useDeleteInvitation(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      invitationService.remove(weddingId, invitationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.all(weddingId) }),
  });
}
