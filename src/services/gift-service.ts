import { api } from "@/lib/api";
import type { Gift, GiftSummary, Paginated } from "@/types/api";

export interface GiftPayload {
  guest_id?: number | null;
  gift_type?: string;
  amount?: number | null;
  item_name?: string | null;
  note?: string | null;
  received_at?: string | null;
}

export const giftService = {
  async list(
    weddingId: number,
    params: { gift_type?: string; page?: number; per_page?: number } = {},
  ): Promise<Paginated<Gift>> {
    const { data } = await api.get<Paginated<Gift>>(`/weddings/${weddingId}/gifts`, {
      params,
    });
    return data;
  },

  async summary(weddingId: number): Promise<GiftSummary> {
    const { data } = await api.get<{ data: GiftSummary }>(
      `/weddings/${weddingId}/gifts/summary`,
    );
    return data.data;
  },

  async create(weddingId: number, payload: GiftPayload): Promise<Gift> {
    const { data } = await api.post<{ data: Gift }>(
      `/weddings/${weddingId}/gifts`,
      payload,
    );
    return data.data;
  },

  async update(weddingId: number, giftId: number, payload: GiftPayload): Promise<Gift> {
    const { data } = await api.put<{ data: Gift }>(
      `/weddings/${weddingId}/gifts/${giftId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, giftId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/gifts/${giftId}`);
  },
};
