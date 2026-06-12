"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  weddingService,
  type WeddingListParams,
  type WeddingPayload,
} from "@/services/wedding-service";
import type { WeddingStatus } from "@/types/api";

export const weddingKeys = {
  all: ["weddings"] as const,
  list: (params: WeddingListParams) => ["weddings", "list", params] as const,
  detail: (id: number) => ["weddings", "detail", id] as const,
  dashboard: (id: number) => ["weddings", "dashboard", id] as const,
  members: (id: number) => ["weddings", "members", id] as const,
};

export function useWeddings(params: WeddingListParams = {}) {
  return useQuery({
    queryKey: weddingKeys.list(params),
    queryFn: () => weddingService.list(params),
  });
}

export function useWedding(id: number) {
  return useQuery({
    queryKey: weddingKeys.detail(id),
    queryFn: () => weddingService.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useWeddingDashboard(id: number) {
  return useQuery({
    queryKey: weddingKeys.dashboard(id),
    queryFn: () => weddingService.dashboard(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useWeddingMembers(id: number) {
  return useQuery({
    queryKey: weddingKeys.members(id),
    queryFn: () => weddingService.members(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeddingPayload) => weddingService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weddingKeys.all }),
  });
}

export function useUpdateWedding(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeddingPayload) => weddingService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weddingKeys.all }),
  });
}

export function useDeleteWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => weddingService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weddingKeys.all }),
  });
}

export function useChangeWeddingStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: WeddingStatus) => weddingService.changeStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weddingKeys.all }),
  });
}
