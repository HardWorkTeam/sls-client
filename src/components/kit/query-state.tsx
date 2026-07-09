"use client";

import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";

/**
 * The slice of a react-query result QueryState consumes. Accepting the whole
 * query object keeps call sites to one prop: `<QueryState query={gifts} …>`.
 */
export interface QueryLike<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch?: () => void;
}

export interface QueryEmptyProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

/**
 * Async boundary for a data-backed section: renders loading → error → empty →
 * content in that order, so a failed request can never masquerade as an empty
 * list (the bug hand-rolled `isLoading ? … : !data ? <EmptyState/> : …`
 * chains have).
 *
 * Empty detection defaults to "array or Laravel-paginated payload with zero
 * rows"; pass `isEmpty` for anything else.
 */
export function QueryState<T>({
  query,
  loadingLabel = "Loading...",
  empty,
  isEmpty = defaultIsEmpty,
  children,
}: {
  query: QueryLike<T>;
  loadingLabel?: string;
  /** Shown when the data loaded but has no rows. Omit to always render children. */
  empty?: QueryEmptyProps;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.isLoading) {
    return <PageLoader label={loadingLabel} />;
  }

  if (query.isError || query.data === undefined) {
    return <ErrorState onRetry={query.refetch} />;
  }

  if (empty && isEmpty(query.data)) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  return <>{children(query.data)}</>;
}

/**
 * Failure card for a section that couldn't load. `role="alert"` so screen
 * readers announce it when it replaces the loader.
 */
export function ErrorState({
  title = "Couldn't load this section",
  description = "Something went wrong while fetching the data. Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50/50 px-6 py-12 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      <p className="max-w-sm text-sm text-zinc-500">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RotateCw className="h-4 w-4" aria-hidden="true" /> Try again
        </Button>
      ) : null}
    </div>
  );
}

function defaultIsEmpty(data: unknown): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (
    data !== null &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: unknown[] }).data.length === 0;
  }
  return false;
}
