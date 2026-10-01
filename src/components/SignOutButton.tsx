"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      // Race against a timeout so a hung network call never leaves the
      // button stuck forever — the user always lands on /login either way.
      await Promise.race([supabase.auth.signOut(), wait(4000)]);
    } finally {
      // A hard navigation (not router.push) guarantees the server re-checks
      // auth from scratch and the dashboard's cached RSC payload is dropped,
      // instead of racing Next's client router cache.
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      title="Sign out"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
    </button>
  );
}
