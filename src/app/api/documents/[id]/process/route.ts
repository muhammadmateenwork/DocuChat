import { NextResponse } from "next/server";
import { AuthError, resolveWritableOrg } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestDocument } from "@/lib/rag/ingest";

// MVP: processing runs synchronously in the request. Fine for typical
// document sizes; a queue-based worker is the natural upgrade for very
// large files or high upload volume.
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await resolveWritableOrg();
    const { id } = await params;
    const admin = createAdminClient();

    const { data: doc, error } = await admin
      .from("documents")
      .select("id, org_id")
      .eq("id", id)
      .single();

    if (error || !doc || doc.org_id !== orgId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await ingestDocument(id);

    return NextResponse.json({ status: "ready" });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to process document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
