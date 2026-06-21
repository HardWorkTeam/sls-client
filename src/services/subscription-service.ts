import { api } from "@/lib/api";
import type { PlatformPaymentDetails, Subscription } from "@/types/api";

export interface SubscriptionResponse {
  data: Subscription | null;
  payment_details: PlatformPaymentDetails;
}

export const subscriptionService = {
  async get(weddingId: number): Promise<SubscriptionResponse> {
    const { data } = await api.get<SubscriptionResponse>(
      `/weddings/${weddingId}/subscription`,
    );
    return data;
  },

  async select(weddingId: number, packageId: number): Promise<Subscription> {
    const { data } = await api.post<{ data: Subscription }>(
      `/weddings/${weddingId}/subscription`,
      { package_id: packageId },
    );
    return data.data;
  },

  async pay(
    weddingId: number,
    payload: { payment_method: string; payment_reference?: string | null },
  ): Promise<Subscription> {
    const { data } = await api.post<{ data: Subscription }>(
      `/weddings/${weddingId}/subscription/pay`,
      payload,
    );
    return data.data;
  },
};
