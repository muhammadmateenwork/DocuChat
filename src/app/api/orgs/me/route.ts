import { NextResponse } from "next/server";
import { AuthError, getCurrentUser, getOrCreateUserOrg } from "@/lib/authz";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError(401, "Not signed in");

    const org = await getOrCreateUserOrg(user.id, user.email ?? null);
    return NextResponse.json(org);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to load organization" }, { status: 500 });
  }
}
