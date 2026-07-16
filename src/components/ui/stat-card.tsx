import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  accent?: "emerald" | "sky" | "amber" | "rose";
}) {
  const accents = {
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  } as const;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        {Icon ? (
          <div className={cn("rounded-lg p-2.5", accents[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-zinc-500">{label}</p>
          <div className="font-semibold text-zinc-900">{value}</div>
          {hint ? <p className="text-xs text-zinc-400">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Render USD and KHR amounts as a compact stacked display for StatCard.
 * Shows each currency on its own line with a currency badge.
 * Falls back to a single "$0.00" when both are zero.
 */
export function DualCurrencyValue({
  usd,
  khr,
  formatMoney,
}: {
  usd: number;
  khr: number;
  formatMoney: (amount: number, currency: string) => string;
}) {
  const hasUsd = usd !== 0;
  const hasKhr = khr !== 0;

  if (!hasUsd && !hasKhr) {
    return <span className="text-xl lg:text-2xl">$0.00</span>;
  }

  // Only one currency — show it full-size
  if (hasUsd && !hasKhr) {
    return <span className="text-xl lg:text-2xl">{formatMoney(usd, "USD")}</span>;
  }
  if (!hasUsd && hasKhr) {
    return <span className="text-xl lg:text-2xl">{formatMoney(khr, "KHR")}</span>;
  }

  // Both currencies — stack them
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-base font-semibold lg:text-lg">{formatMoney(usd, "USD")}</span>
      <span className="text-sm font-medium text-zinc-600">{formatMoney(khr, "KHR")}</span>
    </div>
  );
}
