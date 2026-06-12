import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-emerald-100 text-emerald-800",
        secondary: "bg-zinc-100 text-zinc-700",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        destructive: "bg-red-100 text-red-800",
        info: "bg-sky-100 text-sky-800",
        outline: "border border-zinc-200 text-zinc-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map a domain status string to a badge variant. */
export function statusVariant(
  status: string,
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "published":
    case "accepted":
    case "sent":
    case "active":
      return "success";
    case "draft":
    case "pending":
    case "queued":
      return "secondary";
    case "maybe":
    case "scheduled":
    case "sending":
      return "warning";
    case "cancelled":
    case "declined":
    case "failed":
      return "destructive";
    case "completed":
      return "info";
    default:
      return "outline";
  }
}
