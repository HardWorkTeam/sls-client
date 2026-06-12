import { api } from "@/lib/api";
import type { Announcement, Paginated } from "@/types/api";

export interface AnnouncementPayload {
  title?: string;
  body?: string;
  channel?: string;
  scheduled_at?: string | null;
}

export const announcementService = {
  async list(
    weddingId: number,
    params: { page?: number; per_page?: number } = {},
  ): Promise<Paginated<Announcement>> {
    const { data } = await api.get<Paginated<Announcement>>(
      `/weddings/${weddingId}/announcements`,
      { params },
    );
    return data;
  },

  async create(weddingId: number, payload: AnnouncementPayload): Promise<Announcement> {
    const { data } = await api.post<{ data: Announcement }>(
      `/weddings/${weddingId}/announcements`,
      payload,
    );
    return data.data;
  },

  async update(
    weddingId: number,
    announcementId: number,
    payload: AnnouncementPayload,
  ): Promise<Announcement> {
    const { data } = await api.put<{ data: Announcement }>(
      `/weddings/${weddingId}/announcements/${announcementId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, announcementId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/announcements/${announcementId}`);
  },

  async send(weddingId: number, announcementId: number): Promise<Announcement> {
    const { data } = await api.post<{ data: Announcement }>(
      `/weddings/${weddingId}/announcements/${announcementId}/send`,
    );
    return data.data;
  },
};
