import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types/api";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
      device_name: "client-portal",
    });
    return data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/refresh", {
      device_name: "client-portal",
    });
    return data;
  },

  async updateProfile(payload: {
    name?: string;
    email?: string;
    phone?: string | null;
  }): Promise<User> {
    const { data } = await api.put<{ user: User }>("/auth/profile", payload);
    return data.user;
  },

  async changePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await api.put("/auth/password", payload);
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },
};

