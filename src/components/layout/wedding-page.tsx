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
 * Plan gating (the platform is not free):
 * - `requiresPackage` — the page needs *some* package selected. With none,
 *   the couple is prompted to choose one.
 * - `requires` — the page needs a specific module (implies a package). If a
 *   package is selected but doesn't include the module, an upgrade prompt
 *   shows instead.
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

  const hasPackage = Boolean(wedding?.package);
  const gated = requiresPackage || requires !== undefined;
  // No package chosen yet → must select one first.
  const needsPackage = gated && wedding !== undefined && !hasPackage;
  // Package chosen, but it doesn't include this module → upgrade.
  const moduleLocked =
    requires !== undefined &&
    hasPackage &&
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
      ) : needsPackage ? (
        <PlanGateCard
          title="Choose a package to get started"
          body="Your wedding doesn't have a package yet. Select a plan to unlock your tools and start planning."
          cta="Choose a package"
        />
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
