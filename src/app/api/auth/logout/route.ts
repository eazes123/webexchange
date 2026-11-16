import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = readDb();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDb(db);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
