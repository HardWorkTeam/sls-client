import { api } from "@/lib/api";
import type { Guest, GuestGroup, Paginated } from "@/types/api";

export interface GuestListParams {
  search?: string;
  guest_group_id?: number;
  is_vip?: boolean;
  page?: number;
  per_page?: number;
}

export interface GuestPayload {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  is_vip?: boolean;
  guest_group_id?: number | null;
  invitation_id?: number | null;
}

export const guestService = {
  async list(weddingId: number, params: GuestListParams = {}): Promise<Paginated<Guest>> {
    const { data } = await api.get<Paginated<Guest>>(
      `/weddings/${weddingId}/guests`,
      { params },
    );
    return data;
  },

  async create(weddingId: number, payload: GuestPayload): Promise<Guest> {
    const { data } = await api.post<{ data: Guest }>(
      `/weddings/${weddingId}/guests`,
      payload,
    );
    return data.data;
  },

  async update(weddingId: number, guestId: number, payload: GuestPayload): Promise<Guest> {
    const { data } = await api.put<{ data: Guest }>(
      `/weddings/${weddingId}/guests/${guestId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, guestId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/guests/${guestId}`);
  },

  async importCsv(weddingId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{
      message: string;
      data: { imported: number; skipped: number; errors: string[] };
    }>(`/weddings/${weddingId}/guests/import`, form);
    return data;
  },

  exportUrl(weddingId: number): string {
    return `/weddings/${weddingId}/guests/export`;
  },

  async exportCsv(weddingId: number): Promise<Blob> {
    const { data } = await api.get(`/weddings/${weddingId}/guests/export`, {
      responseType: "blob",
    });
    return data as Blob;
  },

  async bulkInvite(weddingId: number, guestIds: number[], invitationId: number) {
    const { data } = await api.post<{ message: string }>(
      `/weddings/${weddingId}/guests/bulk-invite`,
      { guest_ids: guestIds, invitation_id: invitationId },
    );
    return data;
  },

  async groups(weddingId: number): Promise<GuestGroup[]> {
    const { data } = await api.get<{ data: GuestGroup[] }>(
      `/weddings/${weddingId}/guest-groups`,
    );
    return data.data;
  },

  async createGroup(
    weddingId: number,
    payload: { name: string; type?: string; sort_order?: number },
  ): Promise<GuestGroup> {
    const { data } = await api.post<{ data: GuestGroup }>(
      `/weddings/${weddingId}/guest-groups`,
      payload,
    );
    return data.data;
  },

  async updateGroup(
    weddingId: number,
    groupId: number,
    payload: { name: string; type?: string },
  ): Promise<GuestGroup> {
    const { data } = await api.put<{ data: GuestGroup }>(
      `/weddings/${weddingId}/guest-groups/${groupId}`,
      payload,
    );
    return data.data;
  },

  async removeGroup(weddingId: number, groupId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/guest-groups/${groupId}`);
  },
};
