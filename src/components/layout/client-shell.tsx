"use client";

import {
  Armchair,
  CreditCard,
  Gift,
  Heart,
  Images,
  ListChecks,
  LogOut,
  Mail,
  MailCheck,
  Menu,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageLoader } from "@/components/ui/spinner";
import { useLogout, useMe } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const NAV_ITEMS = [
  { href: "/my-wedding", label: "My Wedding", icon: Heart },
  { href: "/plan", label: "Plan & Payment", icon: CreditCard },
  { href: "/invitations", label: "Invitations", icon: Mail },
  { href: "/guests", label: "Guest List", icon: Users },
  { href: "/rsvp", label: "RSVP Summary", icon: MailCheck },
  { href: "/seating", label: "Seating Plan", icon: Armchair },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/gifts", label: "Gift Tracking", icon: Gift },
  { href: "/expenses", label: "Expense Tracking", icon: Wallet },
  { href: "/timeline", label: "Timeline", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const [hydrated, setHydrated] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useMe();

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/");
    }
  }, [hydrated, token, router]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMobileNavOpen(false), [pathname]);

  if (!hydrated || !token) {
    return <PageLoader label="Checking session..." />;
  }

  const sidebar = (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#16b364] to-[#027a48] text-sm font-bold text-white">
          S
        </span>
        <div>
          <p className="text-sm font-bold text-zinc-900">Srolanh</p>
          <p className="text-[11px] text-zinc-500">Couple Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-100 p-3">
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-medium text-zinc-800">{user?.name}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="-ml-1 flex items-center gap-2 rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
            <span className="text-sm font-bold text-emerald-800">Srolanh</span>
          </button>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="text-sm text-zinc-600"
          >
            Log out
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
