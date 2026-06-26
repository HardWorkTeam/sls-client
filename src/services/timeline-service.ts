import { api } from "@/lib/api";
import type { TimelineEvent } from "@/types/api";

export interface TimelineEventPayload {
  category?: string;
  title?: string;
  description?: string | null;
  starts_at?: string | null;
  location?: string | null;
  google_map_link?: string | null;
  sort_order?: number;
  is_public?: boolean;
}

export const timelineService = {
  async list(weddingId: number, category?: string): Promise<TimelineEvent[]> {
    const { data } = await api.get<{ data: TimelineEvent[] }>(
      `/weddings/${weddingId}/timeline-events`,
      { params: category ? { category } : undefined },
    );
    return data.data;
  },

  async create(weddingId: number, payload: TimelineEventPayload): Promise<TimelineEvent> {
    const { data } = await api.post<{ data: TimelineEvent }>(
      `/weddings/${weddingId}/timeline-events`,
      payload,
    );
    return data.data;
  },

  async update(
    weddingId: number,
    eventId: number,
    payload: TimelineEventPayload,
  ): Promise<TimelineEvent> {
    const { data } = await api.put<{ data: TimelineEvent }>(
      `/weddings/${weddingId}/timeline-events/${eventId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, eventId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/timeline-events/${eventId}`);
  },
};
