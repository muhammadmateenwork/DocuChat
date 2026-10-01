"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Files, MessagesSquare, BarChart3, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Documents", icon: Files, exact: true },
  { href: "/dashboard/chat", label: "Chat", icon: MessagesSquare, exact: false },
  { href: "/dashboard/admin", label: "Admin", icon: BarChart3, exact: false },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <div className="p-3 pb-0">
        <button
          onClick={() => window.dispatchEvent(new Event("docuchat:open-command-palette"))}
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded-lg px-2 py-2">
          <span className="truncate text-sm text-muted-foreground" title={orgName}>
            {orgName}
          </span>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
