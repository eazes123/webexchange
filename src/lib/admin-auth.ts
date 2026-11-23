import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { verifyAdminToken, ADMIN_2FA_COOKIE } from "@/lib/admin-totp";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

type AdminAuthResult = { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>> } | NextResponse;

// Checks only user session + admin email — used by the TOTP verify endpoint itself
export async function requireAdminUserSession(request: NextRequest): Promise<AdminAuthResult> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { user };
}

// Full check: user session + admin email + 2FA cookie
export async function requireAdminSession(request: NextRequest): Promise<AdminAuthResult> {
  const userAuth = await requireAdminUserSession(request);
  if (userAuth instanceof NextResponse) return userAuth;

  const adminToken = request.cookies.get(ADMIN_2FA_COOKIE)?.value;
  if (!verifyAdminToken(adminToken)) {
    return NextResponse.json(
      { error: "Admin 2FA verification required", code: "2FA_REQUIRED" },
      { status: 403 }
    );
  }

  return userAuth;
}
