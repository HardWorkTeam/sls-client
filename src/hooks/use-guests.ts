"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  guestService,
  type GuestListParams,
  type GuestPayload,
} from "@/services/guest-service";

export const guestKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "guests"] as const,
  list: (weddingId: number, params: GuestListParams) =>
    ["weddings", weddingId, "guests", params] as const,
  groups: (weddingId: number) => ["weddings", weddingId, "guest-groups"] as const,
  checkInStats: (weddingId: number) =>
    ["weddings", weddingId, "guests", "check-in-stats"] as const,
};

export function useGuests(weddingId: number, params: GuestListParams = {}) {
  return useQuery({
    queryKey: guestKeys.list(weddingId, params),
    queryFn: () => guestService.list(weddingId, params),
    enabled: weddingId > 0,
  });
}

export function useGuestGroups(weddingId: number) {
  return useQuery({
    queryKey: guestKeys.groups(weddingId),
    queryFn: () => guestService.groups(weddingId),
    enabled: weddingId > 0,
  });
}

function useInvalidateGuests(weddingId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: guestKeys.all(weddingId) });
    queryClient.invalidateQueries({ queryKey: ["weddings", weddingId, "rsvps"] });
    queryClient.invalidateQueries({ queryKey: ["weddings", weddingId, "seating"] });
  };
}

export function useCheckInStats(weddingId: number) {
  return useQuery({
    queryKey: guestKeys.checkInStats(weddingId),
    queryFn: () => guestService.checkInStats(weddingId),
    enabled: weddingId > 0,
  });
}

/** Check a guest in by their scanned QR token. */
export function useScanCheckIn(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: (token: string) => guestService.checkInByToken(weddingId, token),
    onSuccess: invalidate,
  });
}

/** Manually toggle a guest's arrival status. */
export function useSetCheckIn(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: ({ guestId, arrived }: { guestId: number; arrived: boolean }) =>
      guestService.setCheckIn(weddingId, guestId, arrived),
    onSuccess: invalidate,
  });
}

export function useCreateGuest(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: (payload: GuestPayload) => guestService.create(weddingId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateGuest(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: ({ guestId, payload }: { guestId: number; payload: GuestPayload }) =>
      guestService.update(weddingId, guestId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteGuest(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: (guestId: number) => guestService.remove(weddingId, guestId),
    onSuccess: invalidate,
  });
}

export function useImportGuests(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: (file: File) => guestService.importCsv(weddingId, file),
    onSuccess: invalidate,
  });
}

export function useBulkInvite(weddingId: number) {
  const invalidate = useInvalidateGuests(weddingId);
  return useMutation({
    mutationFn: ({ guestIds, invitationId }: { guestIds: number[]; invitationId: number }) =>
      guestService.bulkInvite(weddingId, guestIds, invitationId),
    onSuccess: invalidate,
  });
}

export function useCreateGuestGroup(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; type?: string }) =>
      guestService.createGroup(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: guestKeys.groups(weddingId) }),
  });
}

export function useUpdateGuestGroup(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: { name: string; type?: string } }) =>
      guestService.updateGroup(weddingId, groupId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: guestKeys.groups(weddingId) }),
  });
}

export function useDeleteGuestGroup(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => guestService.removeGroup(weddingId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.groups(weddingId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.all(weddingId) });
    },
  });
}
