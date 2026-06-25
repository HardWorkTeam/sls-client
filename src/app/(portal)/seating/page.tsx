"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { SeatingTab } from "@/components/wedding/seating-tab";

export default function SeatingPage() {
  return (
    <WeddingPage
      title="Seating Plan"
      description="Create tables, assign guests and balance your reception layout."
      requires="seating"
    >
      {(wedding) => <SeatingTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
