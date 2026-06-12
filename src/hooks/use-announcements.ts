"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  announcementService,
  type AnnouncementPayload,
} from "@/services/announcement-service";

export const announcementKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "announcements"] as const,
};

export function useAnnouncements(weddingId: number, page = 1) {
  return useQuery({
    queryKey: [...announcementKeys.all(weddingId), page],
    queryFn: () => announcementService.list(weddingId, { page }),
    enabled: weddingId > 0,
  });
}

export function useCreateAnnouncement(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnnouncementPayload) =>
      announcementService.create(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all(weddingId) }),
  });
}

export function useSendAnnouncement(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: number) =>
      announcementService.send(weddingId, announcementId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all(weddingId) }),
  });
}

export function useDeleteAnnouncement(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: number) =>
      announcementService.remove(weddingId, announcementId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all(weddingId) }),
  });
}
