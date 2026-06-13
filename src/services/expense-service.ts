import { api } from "@/lib/api";
import type { Expense, ExpenseSummary, Paginated } from "@/types/api";

export interface ExpensePayload {
  item_name?: string;
  vendor?: string | null;
  amount?: number;
  paid_amount?: number | null;
  status?: string;
  note?: string | null;
  spent_at?: string | null;
}

export const expenseService = {
  async list(
    weddingId: number,
    params: { status?: string; page?: number; per_page?: number } = {},
  ): Promise<Paginated<Expense>> {
    const { data } = await api.get<Paginated<Expense>>(
      `/weddings/${weddingId}/expenses`,
      { params },
    );
    return data;
  },

  async summary(weddingId: number): Promise<ExpenseSummary> {
    const { data } = await api.get<{ data: ExpenseSummary }>(
      `/weddings/${weddingId}/expenses/summary`,
    );
    return data.data;
  },

  async create(weddingId: number, payload: ExpensePayload): Promise<Expense> {
    const { data } = await api.post<{ data: Expense }>(
      `/weddings/${weddingId}/expenses`,
      payload,
    );
    return data.data;
  },

  async update(
    weddingId: number,
    expenseId: number,
    payload: ExpensePayload,
  ): Promise<Expense> {
    const { data } = await api.put<{ data: Expense }>(
      `/weddings/${weddingId}/expenses/${expenseId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, expenseId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/expenses/${expenseId}`);
  },
};
