import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE, generateToken } from "@/lib/auth-utils";
import { mobileTokenMap, pruneExpiredTokens } from "@/lib/kyc-mobile-tokens";

export const dynamic = "force-dynamic";

// Desktop: creates a multi-use 15-min handoff token
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getSessionUser(sessionToken);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  pruneExpiredTokens();

  const token = generateToken().slice(0, 32);
  mobileTokenMap.set(token, {
    sessionToken,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return NextResponse.json({ token });
}

// Mobile page validation — returns JSON, no redirect, no cookie, token stays alive
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });

  const entry = mobileTokenMap.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    return NextResponse.json({ valid: false, error: "Link expired" }, { status: 410 });
  }

  const user = await getSessionUser(entry.sessionToken);
  if (!user) return NextResponse.json({ valid: false, error: "Session invalid" }, { status: 401 });

  return NextResponse.json({ valid: true, userName: user.fullName });
}
