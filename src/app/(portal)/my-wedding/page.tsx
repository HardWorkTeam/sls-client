"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { OverviewTab } from "@/components/wedding/overview-tab";

export default function MyWeddingPage() {
  return (
    <WeddingPage
      title="My Wedding"
      description="Your wedding overview, details and live RSVP statistics."
    >
      {(wedding) => <OverviewTab wedding={wedding} />}
    </WeddingPage>
  );
}
