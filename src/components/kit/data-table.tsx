"use client";

import { type KeyboardEvent, type ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/api";

/** Tailwind needs literal class names, so the breakpoint map is static. */
const HIDE_BELOW = {
  sm: "max-sm:hidden",
  md: "max-md:hidden",
  lg: "max-lg:hidden",
  xl: "max-xl:hidden",
} as const;

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export interface DataTableColumn<T> {
  /** Stable identity for the column (React key). */
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Extra classes for the body cells (e.g. "font-medium text-zinc-800"). */
  className?: string;
  /** Extra classes for the header cell (e.g. "w-16"). */
  headClassName?: string;
  align?: keyof typeof ALIGN;
  /** Hide this column under the given breakpoint — least important first. */
  hideBelow?: keyof typeof HIDE_BELOW;
}

/**
 * Column-driven table over the ui/table primitives, with built-in pagination
 * and refetch dimming. Loading / error / empty are QueryState's job — by the
 * time rows reach a DataTable they exist; keeping those states out of here
 * means they can't be configured inconsistently per screen.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  meta,
  onPageChange,
  isFetching = false,
  onRowClick,
  rowClassName,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  /** Screen-reader table summary, e.g. "Gifts received". Strongly encouraged. */
  caption?: string;
  /** Laravel paginator meta — renders Pagination when more than one page. */
  meta?: Paginated<unknown>["meta"];
  onPageChange?: (page: number) => void;
  /** True during background refetches: keeps stale rows visible but dimmed. */
  isFetching?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
}) {
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div aria-busy={isFetching || undefined}>
      <Table className={cn(isFetching && "opacity-60 transition-opacity")}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align && ALIGN[column.align],
                  column.hideBelow && HIDE_BELOW[column.hideBelow],
                  column.headClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              className={cn(
                onRowClick &&
                  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40",
                rowClassName?.(row),
              )}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.align && ALIGN[column.align],
                    column.hideBelow && HIDE_BELOW[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && onPageChange ? <Pagination meta={meta} onPageChange={onPageChange} /> : null}
    </div>
  );
}
