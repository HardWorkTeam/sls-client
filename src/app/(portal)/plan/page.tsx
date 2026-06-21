"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { PlanTab } from "@/components/wedding/plan-tab";

export default function PlanPage() {
  return (
    <WeddingPage
      title="Plan & Payment"
      description="Choose your wedding package and pay to activate it."
    >
      {(wedding) => <PlanTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
