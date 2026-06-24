"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { PlanTab } from "@/components/wedding/plan-tab";

export default function PlanPage() {
  return (
    <WeddingPage
      title="Plan & Payment"
      description="Choose your package and pay to unlock all wedding features."
    >
      {(wedding) => <PlanTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
