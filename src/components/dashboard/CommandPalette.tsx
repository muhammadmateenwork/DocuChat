"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Files, MessagesSquare, BarChart3, LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Command = {
  id: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("docuchat:open-command-palette", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("docuchat:open-command-palette", onOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const commands: Command[] = useMemo(
    () => [
      { id: "documents", label: "Go to Documents", group: "Navigate", icon: Files, action: () => router.push("/dashboard") },
      { id: "chat", label: "Go to Chat", group: "Navigate", icon: MessagesSquare, action: () => router.push("/dashboard/chat") },
      { id: "admin", label: "Go to Admin", group: "Navigate", icon: BarChart3, action: () => router.push("/dashboard/admin") },
      {
        id: "signout",
        label: "Sign out",
        group: "Account",
        icon: LogOut,
        action: async () => {
          const supabase = createBrowserSupabaseClient();
          await Promise.race([
            supabase.auth.signOut(),
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ]);
          window.location.href = "/login";
        },
      },
    ],
    [router]
  );

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  function run(command: Command) {
    command.action();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[150] flex items-start justify-center bg-black/60 px-4 pt-[18vh] backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && filtered[activeIndex]) {
                run(filtered[activeIndex]);
              }
            }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results</p>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => run(c)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                i === activeIndex ? "bg-muted" : ""
              }`}
            >
              <c.icon className="h-4 w-4 text-muted-foreground" />
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
