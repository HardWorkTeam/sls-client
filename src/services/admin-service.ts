import { api } from "@/lib/api";
import type {
  DashboardOverview,
  InvitationTemplate,
  Package,
  Paginated,
  Role,
  User,
} from "@/types/api";

export const adminService = {
  async dashboard(): Promise<DashboardOverview> {
    const { data } = await api.get<{ data: DashboardOverview }>("/dashboard/overview");
    return data.data;
  },

  async users(
    params: { search?: string; role?: string; page?: number; per_page?: number } = {},
  ): Promise<Paginated<User>> {
    const { data } = await api.get<Paginated<User>>("/admin/users", { params });
    return data;
  },

  async createUser(payload: {
    name: string;
    email: string;
    phone?: string | null;
    password: string;
    roles: string[];
    is_active?: boolean;
  }): Promise<User> {
    const { data } = await api.post<{ data: User }>("/admin/users", payload);
    return data.data;
  },

  async updateUser(
    userId: number,
    payload: Partial<{
      name: string;
      email: string;
      phone: string | null;
      password: string;
      roles: string[];
      is_active: boolean;
    }>,
  ): Promise<User> {
    const { data } = await api.put<{ data: User }>(`/admin/users/${userId}`, payload);
    return data.data;
  },

  async removeUser(userId: number): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },

  async roles(): Promise<Role[]> {
    const { data } = await api.get<{ data: Role[] }>("/admin/roles");
    return data.data;
  },

  async packages(): Promise<Package[]> {
    const { data } = await api.get<{ data: Package[] }>("/packages");
    return data.data;
  },

  async templates(): Promise<InvitationTemplate[]> {
    const { data } = await api.get<{ data: InvitationTemplate[] }>("/templates");
    return data.data;
  },
};
