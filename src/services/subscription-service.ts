import { api } from "@/lib/api";
import type { PaymentDetails, Subscription } from "@/types/api";

export interface CurrentSubscription {
  subscription: Subscription | null;
  payment_details: PaymentDetails;
}

export interface SubmitPaymentPayload {
  payment_method: "khqr" | "aba" | "bank";
  payment_reference: string;
}

export const subscriptionService = {
  async current(weddingId: number): Promise<CurrentSubscription> {
    const { data } = await api.get<{ data: CurrentSubscription }>(
      `/weddings/${weddingId}/subscription`,
    );
    return data.data;
  },

  async selectPackage(weddingId: number, packageId: number): Promise<Subscription> {
    const { data } = await api.post<{ data: Subscription }>(
      `/weddings/${weddingId}/subscription`,
      { package_id: packageId },
    );
    return data.data;
  },

  async submitPayment(
    weddingId: number,
    payload: SubmitPaymentPayload,
  ): Promise<Subscription> {
    const { data } = await api.post<{ data: Subscription }>(
      `/weddings/${weddingId}/subscription/pay`,
      payload,
    );
    return data.data;
  },
};
