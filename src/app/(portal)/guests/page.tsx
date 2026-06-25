"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { GuestsTab } from "@/components/wedding/guests-tab";

export default function GuestsPage() {
  return (
    <WeddingPage
      title="Guest List"
      description="Manage guests, groups, imports and bulk invitations."
    >
      {(wedding) => (
        <GuestsTab
          weddingId={wedding.id}
          guestLimit={wedding.capabilities?.guest_limit ?? null}
        />
      )}
    </WeddingPage>
  );
}
