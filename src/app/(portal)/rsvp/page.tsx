"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { RsvpTab } from "@/components/wedding/rsvp-tab";

export default function RsvpPage() {
  return (
    <WeddingPage
      title="RSVP Summary"
      description="Track who is coming, who declined and who hasn't answered yet."
      requires="rsvp"
    >
      {(wedding) => <RsvpTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
