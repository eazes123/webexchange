import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, updateUserProfile } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, phone, country } = body as { fullName?: string; phone?: string; country?: string };

  if (fullName !== undefined && fullName.trim().length < 2)
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });

  await updateUserProfile(user.id, { fullName, phone, country });
  return NextResponse.json({ ok: true });
}
