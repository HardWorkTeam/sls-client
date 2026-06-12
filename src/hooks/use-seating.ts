"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { seatingService } from "@/services/seating-service";

export const seatingKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "seating"] as const,
  tables: (weddingId: number) => ["weddings", weddingId, "seating", "tables"] as const,
  report: (weddingId: number) => ["weddings", weddingId, "seating", "report"] as const,
};

export function useTables(weddingId: number) {
  return useQuery({
    queryKey: seatingKeys.tables(weddingId),
    queryFn: () => seatingService.tables(weddingId),
    enabled: weddingId > 0,
  });
}

export function useSeatingReport(weddingId: number) {
  return useQuery({
    queryKey: seatingKeys.report(weddingId),
    queryFn: () => seatingService.report(weddingId),
    enabled: weddingId > 0,
  });
}

function useInvalidateSeating(weddingId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: seatingKeys.all(weddingId) });
    queryClient.invalidateQueries({ queryKey: ["weddings", weddingId, "guests"] });
  };
}

export function useCreateTable(weddingId: number) {
  const invalidate = useInvalidateSeating(weddingId);
  return useMutation({
    mutationFn: (payload: { table_name: string; table_number?: number | null; capacity: number }) =>
      seatingService.createTable(weddingId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTable(weddingId: number) {
  const invalidate = useInvalidateSeating(weddingId);
  return useMutation({
    mutationFn: ({
      tableId,
      payload,
    }: {
      tableId: number;
      payload: { table_name?: string; table_number?: number | null; capacity?: number };
    }) => seatingService.updateTable(weddingId, tableId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTable(weddingId: number) {
  const invalidate = useInvalidateSeating(weddingId);
  return useMutation({
    mutationFn: (tableId: number) => seatingService.removeTable(weddingId, tableId),
    onSuccess: invalidate,
  });
}

export function useAssignSeat(weddingId: number) {
  const invalidate = useInvalidateSeating(weddingId);
  return useMutation({
    mutationFn: (payload: { guest_id: number; wedding_table_id: number; seat_number?: number | null }) =>
      seatingService.assign(weddingId, payload),
    onSuccess: invalidate,
  });
}

export function useUnassignSeat(weddingId: number) {
  const invalidate = useInvalidateSeating(weddingId);
  return useMutation({
    mutationFn: (guestId: number) => seatingService.unassign(weddingId, guestId),
    onSuccess: invalidate,
  });
}

export function useAutoSeat(weddingId: number) {
  const invalidate = useInvalidateSeating(weddingId);
  return useMutation({
    mutationFn: () => seatingService.autoSeat(weddingId),
    onSuccess: invalidate,
  });
}
