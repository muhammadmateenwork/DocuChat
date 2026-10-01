import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth-aware Supabase client for server components / route handlers, using
 * the anon key + the visitor's session cookies. Use this to read who is
 * logged in; use the admin client for actual data access.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component with no request context;
            // safe to ignore because middleware refreshes the session cookie.
          }
        },
      },
    }
  );
}
