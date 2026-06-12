import { api } from "@/lib/api";
import type { Paginated, RsvpResponse, RsvpStats } from "@/types/api";

export const rsvpService = {
  async list(
    weddingId: number,
    params: { status?: string; search?: string; page?: number; per_page?: number } = {},
  ): Promise<Paginated<RsvpResponse>> {
    const { data } = await api.get<Paginated<RsvpResponse>>(
      `/weddings/${weddingId}/rsvps`,
      { params },
    );
    return data;
  },

  async stats(weddingId: number): Promise<RsvpStats> {
    const { data } = await api.get<{ data: RsvpStats }>(
      `/weddings/${weddingId}/rsvps/stats`,
    );
    return data.data;
  },

  async update(
    weddingId: number,
    rsvpId: number,
    payload: Partial<Pick<RsvpResponse, "guest_name" | "phone" | "number_of_guests" | "message" | "status">>,
  ): Promise<RsvpResponse> {
    const { data } = await api.put<{ data: RsvpResponse }>(
      `/weddings/${weddingId}/rsvps/${rsvpId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, rsvpId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/rsvps/${rsvpId}`);
  },
};
