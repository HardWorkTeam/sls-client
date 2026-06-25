"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { GiftsTab } from "@/components/wedding/gifts-tab";

export default function GiftsPage() {
  return (
    <WeddingPage
      title="Gift Tracking"
      description="Record cash gifts, bank transfers and gift items."
      requires="gifts"
    >
      {(wedding) => <GiftsTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
