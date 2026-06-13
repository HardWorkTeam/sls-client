"use client";

import { WeddingPage } from "@/components/layout/wedding-page";
import { ExpensesTab } from "@/components/wedding/expenses-tab";

export default function ExpensesPage() {
  return (
    <WeddingPage
      title="Expense Tracking"
      description="Track vendor costs, deposits and payments against your budget."
    >
      {(wedding) => <ExpensesTab weddingId={wedding.id} />}
    </WeddingPage>
  );
}
