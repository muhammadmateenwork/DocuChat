import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const DEMO_SESSION_COOKIE = "docuchat_demo_session";
export const DEMO_SESSION_MAX_DOCUMENTS = 2;

export class AuthError extends Error {
  constructor(public status: 401 | 403 | 429, message: string) {
    super(message);
  }
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Throws if there is no logged-in user, or they aren't a member of orgId. */
export async function requireOrgMembership(orgId: string) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Not signed in");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) throw new AuthError(403, "Not a member of this organization");

  return { userId: user.id, role: data.role as "owner" | "admin" };
}

/** The signed-in user's org (v1: one org per user, created at signup). */
export async function requireCurrentUserOrg() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Not signed in");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) throw new AuthError(403, "No organization found for this user");

  return { userId: user.id, orgId: data.org_id as string, role: data.role as "owner" | "admin" };
}

export type UserOrg = { orgId: string; role: "owner" | "admin"; name: string };

/**
 * Fetches the signed-in user's org, creating a default one on first visit
 * (v1 is one org per user, bootstrapped lazily instead of via a DB trigger
 * so we don't need to special-case email-confirmation timing).
 */
export async function getOrCreateUserOrg(userId: string, email: string | null): Promise<UserOrg> {
  const admin = createAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("organization_members")
    .select("org_id, role, organizations(name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  if (existing) {
    const org = existing.organizations as unknown as { name: string } | null;
    return { orgId: existing.org_id, role: existing.role, name: org?.name ?? "My workspace" };
  }

  const orgName = email ? `${email.split("@")[0]}'s workspace` : "My workspace";

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgName, owner_id: userId })
    .select("id, name")
    .single();

  if (orgError || !org) throw new Error(orgError?.message || "Failed to create organization");

  const { error: memberError } = await admin
    .from("organization_members")
    .insert({ org_id: org.id, user_id: userId, role: "owner" });

  if (memberError) throw new Error(memberError.message);

  return { orgId: org.id, role: "owner", name: org.name };
}

/** The org id tied to this browser's anonymous demo-upload session cookie, if any. */
export async function getSessionOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!token) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("session_token", token)
    .maybeSingle();

  return data?.id ?? null;
}

/**
 * Read access to an org: the shared curated demo workspace (public), a real
 * signed-in member, or an anonymous demo-upload session that owns it.
 */
export async function requireOrgReadAccess(orgId: string) {
  if (orgId === process.env.DEMO_ORG_ID) return;

  const user = await getCurrentUser();
  if (user) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) return;
  }

  const sessionOrgId = await getSessionOrgId();
  if (sessionOrgId === orgId) return;

  throw new AuthError(403, "Not authorized for this organization");
}

/**
 * The org a caller can upload/manage documents in: a real signed-in user's
 * workspace, or (for anonymous /demo visitors) their session-cookie org,
 * bootstrapped separately via POST /api/demo/session.
 */
export async function resolveWritableOrg(): Promise<{
  orgId: string;
  userId: string | null;
  isSession: boolean;
}> {
  const user = await getCurrentUser();
  if (user) {
    const { orgId } = await requireCurrentUserOrg();
    return { orgId, userId: user.id, isSession: false };
  }

  const sessionOrgId = await getSessionOrgId();
  if (sessionOrgId) return { orgId: sessionOrgId, userId: null, isSession: true };

  throw new AuthError(401, "Not signed in");
}

const DEMO_DAILY_LIMIT = 15;

/** Enforces a per-IP daily question cap on the public /demo workspace. */
export async function enforceDemoRateLimit(ipHash: string) {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from("demo_usage")
    .select("count")
    .eq("ip_hash", ipHash)
    .eq("day", today)
    .maybeSingle();

  const count = existing?.count ?? 0;
  if (count >= DEMO_DAILY_LIMIT) {
    throw new AuthError(429, "Demo question limit reached for today. Sign up for unlimited use.");
  }

  await admin
    .from("demo_usage")
    .upsert({ ip_hash: ipHash, day: today, count: count + 1 }, { onConflict: "ip_hash,day" });
}
