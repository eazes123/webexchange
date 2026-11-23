import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE, generateToken } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// token → { sessionToken, expiresAt }
const mobileTokenMap = new Map<string, { sessionToken: string; expiresAt: number }>();

function pruneExpired() {
  const now = Date.now();
  for (const [k, v] of mobileTokenMap) {
    if (now > v.expiresAt) mobileTokenMap.delete(k);
  }
}

// Desktop: authenticated user generates a handoff token
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getSessionUser(sessionToken);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  pruneExpired();

  const token = generateToken().slice(0, 32);
  mobileTokenMap.set(token, {
    sessionToken,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return NextResponse.json({ token });
}

// Mobile: exchange token for session cookie, redirect to KYC
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const entry = mobileTokenMap.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    return NextResponse.redirect(new URL("/login?error=link-expired", request.url));
  }

  mobileTokenMap.delete(token);

  const res = NextResponse.redirect(new URL("/kyc", request.url));
  res.cookies.set(SESSION_COOKIE, entry.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
