import { api } from "@/lib/api";
import type { CheckInStats, Guest, GuestGroup, Paginated } from "@/types/api";

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

  async removeAll(weddingId: number): Promise<{ message: string; deleted: number }> {
    const { data } = await api.delete<{ message: string; deleted: number }>(
      `/weddings/${weddingId}/guests`,
    );
    return data;
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

  async exportExcel(weddingId: number): Promise<Blob> {
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

  // --- Wedding-day check-in -------------------------------------------------

  /** Mark a guest as arrived by their scanned QR token. */
  async checkInByToken(
    weddingId: number,
    token: string,
  ): Promise<{ guest: Guest; alreadyCheckedIn: boolean }> {
    const { data } = await api.post<{ data: Guest; already_checked_in: boolean }>(
      `/weddings/${weddingId}/guests/check-in`,
      { token },
    );
    return { guest: data.data, alreadyCheckedIn: data.already_checked_in };
  },

  /** Manually set a guest's arrival status from the guest list. */
  async setCheckIn(weddingId: number, guestId: number, arrived: boolean): Promise<Guest> {
    const { data } = await api.post<{ data: Guest }>(
      `/weddings/${weddingId}/guests/${guestId}/check-in`,
      { arrived },
    );
    return data.data;
  },

  async checkInStats(weddingId: number): Promise<CheckInStats> {
    const { data } = await api.get<{ data: CheckInStats }>(
      `/weddings/${weddingId}/guests/check-in/stats`,
    );
    return data.data;
  },

  /** Fetch a guest's check-in QR code as raw SVG markup. */
  async qrSvg(weddingId: number, guestId: number): Promise<string> {
    const { data } = await api.get<string>(
      `/weddings/${weddingId}/guests/${guestId}/qr`,
      { responseType: "text", headers: { Accept: "image/svg+xml" } },
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
