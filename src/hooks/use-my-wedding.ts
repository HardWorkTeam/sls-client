"use client";

import { useWeddings } from "@/hooks/use-weddings";
import type { Wedding } from "@/types/api";

/**
 * The couple portal works against a single wedding: the first wedding the
 * authenticated user is a member of (couples normally have exactly one).
 */
export function useMyWedding(): {
  wedding: Wedding | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useWeddings({ per_page: 1 });

  return { wedding: data?.data[0], isLoading };
}
