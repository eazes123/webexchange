import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
