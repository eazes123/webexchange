import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, updateUserSecurity } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { totpVerify } from "@/lib/totp";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "Google Authenticator is not enabled" }, { status: 400 });
  }

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  if (!totpVerify(user.totpSecret, code.trim())) {
    return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
  }

  await updateUserSecurity(user.id, { totpSecret: null, totpEnabled: false });
  return NextResponse.json({ success: true });
}
