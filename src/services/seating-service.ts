import { api } from "@/lib/api";
import type { SeatingReport, WeddingTable } from "@/types/api";

export const seatingService = {
  async tables(weddingId: number): Promise<WeddingTable[]> {
    const { data } = await api.get<{ data: WeddingTable[] }>(
      `/weddings/${weddingId}/tables`,
    );
    return data.data;
  },

  async createTable(
    weddingId: number,
    payload: { table_name: string; table_number?: number | null; capacity: number },
  ): Promise<WeddingTable> {
    const { data } = await api.post<{ data: WeddingTable }>(
      `/weddings/${weddingId}/tables`,
      payload,
    );
    return data.data;
  },

  async updateTable(
    weddingId: number,
    tableId: number,
    payload: { table_name?: string; table_number?: number | null; capacity?: number },
  ): Promise<WeddingTable> {
    const { data } = await api.put<{ data: WeddingTable }>(
      `/weddings/${weddingId}/tables/${tableId}`,
      payload,
    );
    return data.data;
  },

  async removeTable(weddingId: number, tableId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/tables/${tableId}`);
  },

  async importCsv(weddingId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{
      message: string;
      data: { imported: number; skipped: number; errors: string[] };
    }>(`/weddings/${weddingId}/tables/import`, form);
    return data;
  },

  async exportCsv(weddingId: number): Promise<Blob> {
    const { data } = await api.get(`/weddings/${weddingId}/tables/export`, {
      responseType: "blob",
    });
    return data as Blob;
  },

  async assign(
    weddingId: number,
    payload: { guest_id: number; wedding_table_id: number; seat_number?: number | null },
  ): Promise<void> {
    await api.post(`/weddings/${weddingId}/seatings/assign`, payload);
  },

  async unassign(weddingId: number, guestId: number): Promise<void> {
    await api.post(`/weddings/${weddingId}/seatings/unassign`, { guest_id: guestId });
  },

  async autoSeat(weddingId: number): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      `/weddings/${weddingId}/seatings/auto`,
    );
    return data;
  },

  async report(weddingId: number): Promise<SeatingReport> {
    const { data } = await api.get<{ data: SeatingReport }>(
      `/weddings/${weddingId}/seatings/report`,
    );
    return data.data;
  },
};
