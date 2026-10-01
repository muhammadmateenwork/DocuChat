import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, DEMO_SESSION_MAX_DOCUMENTS, resolveWritableOrg } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  filename: z.string().min(1).max(255),
  kind: z.enum(["pdf", "docx"]),
});

export async function GET() {
  try {
    const { orgId } = await resolveWritableOrg();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("documents")
      .select("id, filename, kind, status, error, page_count, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ documents: data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orgId, userId, isSession } = await resolveWritableOrg();
    const body = createSchema.parse(await request.json());
    const admin = createAdminClient();

    if (isSession) {
      const { count } = await admin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId);
      if ((count ?? 0) >= DEMO_SESSION_MAX_DOCUMENTS) {
        return NextResponse.json(
          { error: `Demo sessions are limited to ${DEMO_SESSION_MAX_DOCUMENTS} documents. Sign up for unlimited uploads.` },
          { status: 400 }
        );
      }
    }

    const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${orgId}/${crypto.randomUUID()}-${safeName}`;

    const { data: doc, error: insertError } = await admin
      .from("documents")
      .insert({
        org_id: orgId,
        filename: body.filename,
        storage_path: storagePath,
        kind: body.kind,
        status: "processing",
        uploaded_by: userId,
      })
      .select("id")
      .single();

    if (insertError || !doc) throw new Error(insertError?.message || "Insert failed");

    const { data: signed, error: signError } = await admin.storage
      .from("documents")
      .createSignedUploadUrl(storagePath);

    if (signError || !signed) {
      await admin.from("documents").delete().eq("id", doc.id);
      throw new Error(signError?.message || "Failed to create upload URL");
    }

    return NextResponse.json({
      documentId: doc.id,
      path: signed.path,
      token: signed.token,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to create document";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
