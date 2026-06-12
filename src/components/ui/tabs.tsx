"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            value === tab.value
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;
  return <div role="tabpanel">{children}</div>;
}
