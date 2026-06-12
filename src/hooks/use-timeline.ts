"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  timelineService,
  type TimelineEventPayload,
} from "@/services/timeline-service";

export const timelineKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "timeline"] as const,
};

export function useTimeline(weddingId: number) {
  return useQuery({
    queryKey: timelineKeys.all(weddingId),
    queryFn: () => timelineService.list(weddingId),
    enabled: weddingId > 0,
  });
}

export function useCreateTimelineEvent(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TimelineEventPayload) =>
      timelineService.create(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(weddingId) }),
  });
}

export function useUpdateTimelineEvent(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: number; payload: TimelineEventPayload }) =>
      timelineService.update(weddingId, eventId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(weddingId) }),
  });
}

export function useDeleteTimelineEvent(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => timelineService.remove(weddingId, eventId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: timelineKeys.all(weddingId) }),
  });
}
