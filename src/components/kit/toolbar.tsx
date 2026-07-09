import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The filters-left / actions-right row above every list. Wraps on small
 * screens instead of overflowing.
 *
 *   <Toolbar actions={<Button onClick={openDialog}>Record Gift</Button>}>
 *     <SearchInput onSearch={setSearch} />
 *     <Select …>…</Select>
 *   </Toolbar>
 */
export function Toolbar({
  children,
  actions,
  className,
}: {
  /** Filter controls (search, selects); laid out left, wrapping. */
  children?: ReactNode;
  /** Primary actions (create buttons); laid out right. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
