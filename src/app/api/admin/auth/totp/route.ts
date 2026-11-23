import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { verifyTotp, issueAdminToken, totpUri, ADMIN_2FA_COOKIE } from "@/lib/admin-totp";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_SESSION_TTL_S = 2 * 60 * 60; // 2 hours

async function getAdminUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await getSessionUser(token);
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

// GET — returns otpauth:// URI so admin can scan QR first time
export async function GET(request: NextRequest) {
  const user = await getAdminUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_TOTP_SECRET not configured" }, { status: 500 });

  return NextResponse.json({ uri: totpUri(secret) });
}

// POST — verify TOTP code and issue admin 2FA cookie
export async function POST(request: NextRequest) {
  const user = await getAdminUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json() as { code: string };
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_TOTP_SECRET not configured" }, { status: 500 });

  if (!code || !verifyTotp(secret, String(code))) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  const adminToken = issueAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_2FA_COOKIE, adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_TTL_S,
    path: "/",
  });
  return res;
}
