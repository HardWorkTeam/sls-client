"use client";

import { type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { useMyWedding } from "@/hooks/use-my-wedding";
import type { Wedding } from "@/types/api";

/**
 * Resolves the couple's wedding and renders the page body with it, with
 * shared loading / empty handling.
 */
export function WeddingPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: (wedding: Wedding) => ReactNode;
}) {
  const { wedding, isLoading } = useMyWedding();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        {description ? <p className="text-sm text-zinc-500">{description}</p> : null}
      </div>
      {isLoading ? (
        <PageLoader label="Loading your wedding..." />
      ) : !wedding ? (
        <EmptyState
          title="No wedding linked to your account"
          description="Ask your wedding organizer to add you as a member of your wedding project."
        />
      ) : (
        children(wedding)
      )}
    </div>
  );
}
