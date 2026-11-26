import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, updateUserSecurity } from "@/lib/db";
import { verifyPassword, hashPassword, SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await updateUserSecurity(user.id, { passwordHash: hashPassword(newPassword) });
  return NextResponse.json({ success: true });
}
