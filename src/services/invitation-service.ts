import { api, API_URL } from "@/lib/api";
import type { Invitation } from "@/types/api";

export interface InvitationPayload {
  invitation_template_id?: number | null;
  title?: string | null;
  cover_image_path?: string | null;
  settings?: Record<string, unknown> | null;
}

export const invitationService = {
  async list(weddingId: number): Promise<Invitation[]> {
    const { data } = await api.get<{ data: Invitation[] }>(
      `/weddings/${weddingId}/invitations`,
    );
    return data.data;
  },

  async create(weddingId: number, payload: InvitationPayload): Promise<Invitation> {
    const { data } = await api.post<{ data: Invitation }>(
      `/weddings/${weddingId}/invitations`,
      payload,
    );
    return data.data;
  },

  async update(
    weddingId: number,
    invitationId: number,
    payload: InvitationPayload & { status?: string },
  ): Promise<Invitation> {
    const { data } = await api.put<{ data: Invitation }>(
      `/weddings/${weddingId}/invitations/${invitationId}`,
      payload,
    );
    return data.data;
  },

  async remove(weddingId: number, invitationId: number): Promise<void> {
    await api.delete(`/weddings/${weddingId}/invitations/${invitationId}`);
  },

  async publish(weddingId: number, invitationId: number): Promise<Invitation> {
    const { data } = await api.post<{ data: Invitation }>(
      `/weddings/${weddingId}/invitations/${invitationId}/publish`,
    );
    return data.data;
  },

  qrUrl(weddingId: number, invitationId: number): string {
    return `${API_URL}/weddings/${weddingId}/invitations/${invitationId}/qr`;
  },

  async qrSvg(weddingId: number, invitationId: number): Promise<string> {
    const { data } = await api.get<string>(
      `/weddings/${weddingId}/invitations/${invitationId}/qr`,
      { responseType: "text" },
    );
    return data;
  },
};
