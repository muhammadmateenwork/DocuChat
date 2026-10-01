import { NextResponse } from "next/server";
import { AuthError, requireCurrentUserOrg } from "@/lib/authz";
import { getQuestionLog } from "@/lib/admin";

export async function GET() {
  try {
    const { orgId } = await requireCurrentUserOrg();
    const log = await getQuestionLog(orgId);
    return NextResponse.json(log);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 });
  }
}
