"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { CreateWeddingForm } from "@/components/wedding/create-wedding-form";
import { useMyWedding } from "@/hooks/use-my-wedding";
import type { GatedModule, Wedding } from "@/types/api";

/**
 * Resolves the couple's wedding and renders the page body with it, with
 * shared loading / empty handling.
 *
 * Plan gating (the platform is not free): features unlock only once the plan
 * is PAID (admin-confirmed). A package that is merely selected, awaiting
 * confirmation, or rejected stays locked.
 * - `requiresPackage` — the page needs any paid plan.
 * - `requires` — the page needs a specific module. If the paid plan doesn't
 *   include it, an upgrade prompt shows instead.
 */
export function WeddingPage({
  title,
  description,
  requires,
  requiresPackage,
  children,
}: {
  title: string;
  description?: string;
  requires?: GatedModule;
  requiresPackage?: boolean;
  children: (wedding: Wedding) => ReactNode;
}) {
  const { wedding, isLoading } = useMyWedding();

  const isPaid = wedding?.payment_status === "paid";
  const gated = requiresPackage || requires !== undefined;
  // Plan isn't active (no package, or pending / submitted / rejected payment).
  const notActive = gated && wedding !== undefined && !isPaid;
  // Plan is paid, but it doesn't include this module → upgrade.
  const moduleLocked =
    requires !== undefined &&
    isPaid &&
    wedding?.capabilities !== undefined &&
    !wedding.capabilities.modules[requires];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        {description ? <p className="text-sm text-zinc-500">{description}</p> : null}
      </div>
      {isLoading ? (
        <PageLoader label="Loading your wedding..." />
      ) : !wedding ? (
        <CreateWeddingForm />
      ) : notActive ? (
        <PlanGateCard {...lockedCopy(wedding.payment_status)} />
      ) : moduleLocked ? (
        <PlanGateCard
          title="This feature isn't in your current plan"
          body={`Upgrade to a plan that includes ${title.toLowerCase()} to unlock it.`}
          cta="View plans"
        />
      ) : (
        children(wedding)
      )}
    </div>
  );
}

/** Message for a locked feature, tailored to where the plan is in payment. */
function lockedCopy(status: Wedding["payment_status"]): {
  title: string;
  body: string;
  cta: string;
} {
  switch (status) {
    case "pending":
      return {
        title: "Complete your payment to unlock this",
        body: "You've selected a plan. Submit your payment on the Plan & Payment page — your tools unlock once an admin confirms it.",
        cta: "Go to Plan & Payment",
      };
    case "submitted":
      return {
        title: "Your payment is awaiting confirmation",
        body: "We've received your payment. This feature unlocks as soon as an administrator confirms it.",
        cta: "View payment status",
      };
    case "rejected":
      return {
        title: "Your payment was rejected",
        body: "Please re-select a plan and submit your payment again to unlock your tools.",
        cta: "Go to Plan & Payment",
      };
    default:
      return {
        title: "Choose a package to get started",
        body: "Your wedding doesn't have an active plan yet. Choose a package and complete payment to unlock your tools.",
        cta: "Choose a package",
      };
  }
}

function PlanGateCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 p-6">
        <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">{title}</p>
          <p className="text-sm text-zinc-500">{body}</p>
        </div>
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {cta}
        </Link>
      </CardContent>
    </Card>
  );
}
