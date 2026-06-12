import { api } from "@/lib/api";
import type {
  Paginated,
  Wedding,
  WeddingDashboard,
  WeddingMember,
  WeddingStatus,
} from "@/types/api";

export interface WeddingListParams {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface WeddingPayload {
  wedding_name?: string;
  bride_name?: string;
  groom_name?: string;
  phone?: string | null;
  email?: string | null;
  wedding_date?: string | null;
  wedding_time?: string | null;
  ceremony_venue?: string | null;
  reception_venue?: string | null;
  google_map_link?: string | null;
  story_description?: string | null;
  package_id?: number | null;
}

export const weddingService = {
  async list(params: WeddingListParams = {}): Promise<Paginated<Wedding>> {
    const { data } = await api.get<Paginated<Wedding>>("/weddings", { params });
    return data;
  },

  async get(id: number): Promise<Wedding> {
    const { data } = await api.get<{ data: Wedding }>(`/weddings/${id}`);
    return data.data;
  },

  async create(payload: WeddingPayload): Promise<Wedding> {
    const { data } = await api.post<{ data: Wedding }>("/weddings", payload);
    return data.data;
  },

  async update(id: number, payload: WeddingPayload): Promise<Wedding> {
    const { data } = await api.put<{ data: Wedding }>(`/weddings/${id}`, payload);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/weddings/${id}`);
  },

  async changeStatus(id: number, status: WeddingStatus): Promise<Wedding> {
    const { data } = await api.post<{ data: Wedding }>(`/weddings/${id}/status`, {
      status,
    });
    return data.data;
  },

  async dashboard(id: number): Promise<WeddingDashboard> {
    const { data } = await api.get<{ data: WeddingDashboard }>(
      `/weddings/${id}/dashboard`,
    );
    return data.data;
  },

  async members(id: number): Promise<WeddingMember[]> {
    const { data } = await api.get<{ data: WeddingMember[] }>(
      `/weddings/${id}/members`,
    );
    return data.data;
  },

  async addMember(
    id: number,
    payload: { user_id: number; member_role: string; is_primary?: boolean },
  ): Promise<WeddingMember> {
    const { data } = await api.post<{ data: WeddingMember }>(
      `/weddings/${id}/members`,
      payload,
    );
    return data.data;
  },

  async removeMember(id: number, memberId: number): Promise<void> {
    await api.delete(`/weddings/${id}/members/${memberId}`);
  },
};
