import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only code (API routes, scripts). Bypasses
 * RLS entirely — every caller of this module is responsible for its own
 * authorization checks (see src/lib/authz.ts). Never import this from
 * client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
