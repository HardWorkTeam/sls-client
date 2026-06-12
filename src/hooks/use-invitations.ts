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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.all(weddingId) }),
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
