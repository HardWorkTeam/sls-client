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
 * Render USD and KHR amounts for a StatCard.
 *
 * USD and KHR are tracked as two independent pools (gifts/expenses recorded in
 * each currency), NOT one amount converted into the other. When both are
 * present they're joined by a muted "+" so the reader sees two separate totals
 * that add up — never "$30 = KHR 150,000". Falls back to "$0.00" when empty.
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

  // Both currencies — join with "+" so they read as two separate pools that
  // sum, not as a USD↔KHR conversion. Wraps on narrow cards with the "+"
  // leading the second line, keeping the additive meaning clear.
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className="text-base font-semibold lg:text-lg">{formatMoney(usd, "USD")}</span>
      <span className="text-sm font-normal text-zinc-400">+</span>
      <span className="text-base font-semibold lg:text-lg">{formatMoney(khr, "KHR")}</span>
    </div>
  );
}
