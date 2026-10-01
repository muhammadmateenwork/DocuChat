"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Files, MessagesSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Docs", icon: Files, exact: true },
  { href: "/dashboard/chat", label: "Chat", icon: MessagesSquare, exact: false },
  { href: "/dashboard/admin", label: "Admin", icon: BarChart3, exact: false },
];

export function MobileTopNav() {
  const pathname = usePathname();

  return (
    <header className="flex flex-col border-b border-border bg-card md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <SignOutButton />
      </div>
      <nav className="flex border-t border-border">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                active ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
