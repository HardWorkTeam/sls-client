"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseService, type ExpensePayload } from "@/services/expense-service";

export const expenseKeys = {
  all: (weddingId: number) => ["weddings", weddingId, "expenses"] as const,
  list: (weddingId: number, params: object) =>
    ["weddings", weddingId, "expenses", "list", params] as const,
  summary: (weddingId: number) =>
    ["weddings", weddingId, "expenses", "summary"] as const,
};

export function useExpenses(
  weddingId: number,
  params: { status?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: expenseKeys.list(weddingId, params),
    queryFn: () => expenseService.list(weddingId, params),
    enabled: weddingId > 0,
  });
}

export function useExpenseSummary(weddingId: number) {
  return useQuery({
    queryKey: expenseKeys.summary(weddingId),
    queryFn: () => expenseService.summary(weddingId),
    enabled: weddingId > 0,
  });
}

export function useCreateExpense(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpensePayload) =>
      expenseService.create(weddingId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: expenseKeys.all(weddingId) }),
  });
}

export function useUpdateExpense(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: number;
      payload: ExpensePayload;
    }) => expenseService.update(weddingId, expenseId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: expenseKeys.all(weddingId) }),
  });
}

export function useDeleteExpense(weddingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: number) => expenseService.remove(weddingId, expenseId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: expenseKeys.all(weddingId) }),
  });
}
