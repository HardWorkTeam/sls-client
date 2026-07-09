"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

/**
 * Debounced search box: owns its input state and calls `onSearch` once the
 * user stops typing, so list screens only handle the settled value:
 *
 *   <SearchInput onSearch={(q) => { setSearch(q); setPage(1); }} />
 *
 * Includes a clear button (which fires `onSearch("")` immediately).
 */
export function SearchInput({
  onSearch,
  defaultValue = "",
  delayMs = 300,
  placeholder = "Search...",
  className,
  "aria-label": ariaLabel,
}: {
  onSearch: (query: string) => void;
  defaultValue?: string;
  delayMs?: number;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const debounced = useDebouncedValue(value, delayMs);

  // Latest-callback ref so a new inline `onSearch` each render doesn't
  // retrigger the effect; skip the mount so the initial value isn't echoed.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    onSearchRef.current(debounced);
  }, [debounced]);

  return (
    <div className={cn("relative w-full max-w-xs", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          onClick={() => {
            setValue("");
            onSearchRef.current("");
          }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
