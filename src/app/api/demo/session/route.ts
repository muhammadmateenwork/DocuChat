import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_SESSION_COOKIE } from "@/lib/authz";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h — this is a throwaway demo sandbox

/**
 * Bootstraps (or returns the existing) ephemeral organization for an
 * anonymous /demo visitor who wants to upload their own documents.
 * Idempotent: safe to call every time the "Your documents" tab is opened.
 */
export async function POST() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  const admin = createAdminClient();

  if (existingToken) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("session_token", existingToken)
      .maybeSingle();
    if (data) return NextResponse.json({ orgId: data.id });
  }

  const token = crypto.randomUUID();
  const { data: org, error } = await admin
    .from("organizations")
    .insert({ name: "Your demo workspace", session_token: token })
    .select("id")
    .single();

  if (error || !org) {
    return NextResponse.json({ error: "Failed to start a demo session" }, { status: 500 });
  }

  const response = NextResponse.json({ orgId: org.id });
  response.cookies.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return response;
}
