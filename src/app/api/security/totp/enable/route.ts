import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, updateUserSecurity } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { totpVerify, getPendingSecret, clearPendingSecret } from "@/lib/totp";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, secret } = await request.json();
  if (!code || !secret) return NextResponse.json({ error: "Code and secret required" }, { status: 400 });

  if (!totpVerify(secret.trim(), code.trim())) {
    return NextResponse.json({ error: "Invalid code. Scan the QR again and try." }, { status: 400 });
  }

  await updateUserSecurity(user.id, { totpSecret: secret.trim(), totpEnabled: true });
  clearPendingSecret(user.id);
  return NextResponse.json({ success: true });
}
