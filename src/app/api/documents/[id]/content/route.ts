import { NextResponse } from "next/server";
import { AuthError, requireOrgReadAccess } from "@/lib/authz";
import { getDocumentContent } from "@/lib/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getDocumentContent(id);

    await requireOrgReadAccess(data.orgId);

    return NextResponse.json({
      filename: data.filename,
      kind: data.kind,
      sections: data.sections,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}
