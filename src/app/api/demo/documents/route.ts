import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public, unauthenticated: lists the seeded demo workspace's documents. */
export async function GET() {
  const demoOrgId = process.env.DEMO_ORG_ID;
  if (!demoOrgId) return NextResponse.json({ documents: [] });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("documents")
    .select("id, filename, kind, page_count")
    .eq("org_id", demoOrgId)
    .eq("status", "ready")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ documents: [] });
  return NextResponse.json({ documents: data ?? [] });
}
