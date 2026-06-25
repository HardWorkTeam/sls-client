"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { InvitationsTab } from "@/components/wedding/invitations-tab";

export default function InvitationsPage() {
  return (
    <WeddingPage
      title="Invitations"
      description="Create and manage your digital wedding invitations, share links and QR codes."
    >
      {(wedding) => (
        <InvitationsTab
          weddingId={wedding.id}
          designLimit={wedding.capabilities?.invitation_design_limit ?? null}
          hasPackage={Boolean(wedding.package)}
        />
      )}
    </WeddingPage>
  );
}
