import { NextResponse } from "next/server";
import { AuthError, resolveWritableOrg } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await resolveWritableOrg();
    const { id } = await params;
    const admin = createAdminClient();

    const { data: doc, error } = await admin
      .from("documents")
      .select("id, org_id, storage_path")
      .eq("id", id)
      .single();

    if (error || !doc || doc.org_id !== orgId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await admin.storage.from("documents").remove([doc.storage_path]);
    await admin.from("documents").delete().eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
