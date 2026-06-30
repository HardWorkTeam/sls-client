"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { GuestsTab } from "@/components/wedding/guests-tab";

export default function GuestsPage() {
  return (
    <WeddingPage
      title="Guest List"
      description="Manage guests, groups, imports and bulk invitations."
      requiresPackage
    >
      {(wedding) => (
        <GuestsTab
          weddingId={wedding.id}
          guestLimit={wedding.capabilities?.guest_limit ?? null}
          // Personalized invite links require the RSVP module. FREE packages
          // don't include it, so the copy-link action is hidden for them.
          canShareInvite={wedding.capabilities ? wedding.capabilities.modules.rsvp : true}
          // Wedding-day QR check-in is a plan-gated module.
          canCheckIn={wedding.capabilities ? wedding.capabilities.modules.checkin : false}
        />
      )}
    </WeddingPage>
  );
}
