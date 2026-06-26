"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { TimelineTab } from "@/components/wedding/timeline-tab";

export default function TimelinePage() {
  return (
    <WeddingPage
      title="Event Timeline"
      description="Plan the engagement, ceremony, reception and after party."
      requires="timeline"
    >
      {(wedding) => <TimelineTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
