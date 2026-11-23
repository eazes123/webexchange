import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { createMobileToken, verifyMobileToken } from "@/lib/kyc-mobile-tokens";

export const dynamic = "force-dynamic";

// Desktop: creates a stateless 15-min HMAC-signed handoff token
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getSessionUser(sessionToken);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = createMobileToken(sessionToken);
  return NextResponse.json({ token });
}

// Mobile page validation — returns JSON, no redirect, no cookie
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });

  const sessionToken = verifyMobileToken(token);
  if (!sessionToken) {
    return NextResponse.json({ valid: false, error: "Link expired" }, { status: 410 });
  }

  const user = await getSessionUser(sessionToken);
  if (!user) return NextResponse.json({ valid: false, error: "Session invalid" }, { status: 401 });

  return NextResponse.json({ valid: true, userName: user.fullName });
}
