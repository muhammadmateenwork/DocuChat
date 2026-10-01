import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireOrgReadAccess } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNED_URL_TTL_SECONDS = 60 * 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: doc, error } = await admin
      .from("documents")
      .select("id, org_id, storage_path")
      .eq("id", id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await requireOrgReadAccess(doc.org_id);

    const { data: signed, error: signError } = await admin.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed) {
      throw new Error(signError?.message || "Failed to sign URL");
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}
