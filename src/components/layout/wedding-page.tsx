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
 * shared loading / empty handling. Pass `requires` to gate the page behind a
 * plan module — couples whose paid plan lacks it see an upgrade prompt.
 */
export function WeddingPage({
  title,
  description,
  requires,
  children,
}: {
  title: string;
  description?: string;
  requires?: GatedModule;
  children: (wedding: Wedding) => ReactNode;
}) {
  const { wedding, isLoading } = useMyWedding();

  const locked =
    requires !== undefined &&
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
      ) : locked ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">
                This feature isn&apos;t in your current plan
              </p>
              <p className="text-sm text-zinc-500">
                Upgrade to a plan that includes {title.toLowerCase()} to unlock it. Your
                plan activates once your payment is confirmed.
              </p>
            </div>
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              View plans
            </Link>
          </CardContent>
        </Card>
      ) : (
        children(wedding)
      )}
    </div>
  );
}
