import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { generateTotpSecret, totpUri } from "@/lib/totp";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = generateTotpSecret();
  const uri = totpUri(user.email, secret);

  return NextResponse.json({ secret, uri });
}
